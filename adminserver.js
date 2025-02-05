require('./models/db');

const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const multer = require('multer');

const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');

const session = require('express-session');
var app = express();

const schedule = require('node-schedule');
const mongoose = require('mongoose');
const Astrologer = mongoose.model('astrologer');
const Call       = mongoose.model('call');
const UpcomingLiveAstrologer = mongoose.model("upcomingLiveAstrologer");
const fs = require('fs');


// Schedule the job to run every 12 H
const job = schedule.scheduleJob('0 */12 * * *', async () => {
  const moment = require('moment-timezone');
  try {
    // Calculate 7 days ago
    const AgoTime = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');
    const inactiveAstro = await Astrologer.find({
      Updated_date: { $lt: AgoTime },
      is_chat_online: { $in: [null, 'off'] },
      is_voice_online: { $in: [null, 'off'] },
      // is_video_online: { $in: [null, 'off'] },
      status: 'Active',
    });

    await Promise.all(
      inactiveAstro.map(async (user) => {
        await Astrologer.findByIdAndUpdate(user._id, { status: 'InActive' });
      })
    );

    console.log('Inactive Astro updated successfully', new Date().toLocaleString());
    // console.log('Inactive users', inactiveAstro);
  } catch (error) {
    console.error('Error updating inactive users:', error);
  }
});

// Schedule the job to run every 20 minutes
schedule.scheduleJob('*/20 * * * *', async () => {
  const moment = require('moment');
  console.log('Running task to delete files in kunddli folder...');
  deleteFiles();

  try {
    const Live = await UpcomingLiveAstrologer.find();

    const currentTime = moment();
    const upcomingNotifications = Live.filter(entry => {
      const scheduleTime = moment(entry.schedule_time, 'DD-MM-YYYY h:mm A');
      const timeDifference = scheduleTime.diff(currentTime, 'minutes');
      return timeDifference >= 5 && timeDifference <= 25;
    });

    // Send notifications for the filtered entries
    for (const entry of upcomingNotifications) {
      await sendNotification(entry);
    }

    console.log("Scheduled job executed successfully.");
  } catch (error) {
    console.error("Error executing scheduled job:", error);
  }
});

schedule.scheduleJob('*/20 * * * *', async () => {
  try {
    // Get the current time and calculate the 3-day limit
    const currentTime = new Date();
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Query for calls with status 'initiate', ensuring their max duration + 5 minutes has passed and they are within the last 3 days
    const calls = await Call.find({
      status: 'initiate',
      $expr: {
        $and: [
          { $gte: [{ $toDate: "$start_time" }, threeDaysAgo] },

          // Calculate the effective end time: start_time + max_call_duration + 5 minutes
          // Check if this end time has already passed compared to currentTime
          { $lte: [{ $add: [{ $toDate: "$start_time" }, { $multiply: [{ $add: ["$max_call_duracation", 5] }, 60 * 1000] }] }, currentTime] }
        ]
      }
    });

    console.log('Filtered calls:', calls);

    // Loop through the filtered calls and update both the call status and astrologer status
    for (const call of calls) {
      await Call.updateOne(
        { _id: call._id },
        { $set: { status: 'auto disconnected' } }
      );

      await Astrologer.updateOne(
        { _id: call.astrologer_id },
        { $set: { is_busy: 0 } }
      );
    }

    console.log('Updated calls and astrologer statuses');
    
  } catch (error) {
    console.error('Error fetching or updating calls/astrologers:', error);
  }
});




async function sendNotification(entry) {
  const astrologer = await Astrologer.findById(entry.astrologer_id)
  // var data_dis = { "notification_type": status, "title": 'AstroPush', "body": 'Your AstroPush application was made offline by admin as you disconnected your internet.', "type": call_data.call_type, "notification_id": notification_id };
  var data = { "notification_type": "Schedule live", "body": `${astrologer.name} Your live session is schedule at ${entry.schedule_time} `, "title": "Schedule live" };
  send_notification_single(astrologer.deviceToken, data);
  console.log(`Sending notification for schedule at ${entry.schedule_time}  id ${astrologer.name}`);
}

const admin = require('./controllers/firebase/firebaseAdmin');
function send_notification_single(deviceToken, data) {

  const stringData = Object.keys(data).reduce((result, key) => {
    result[key] = String(data[key]);
    return result;
  }, {});

  const message = {
    token: deviceToken,
    notification: {
      title: data.title,
      body: data.body,
    },
    // You can also send custom data
    data: stringData || {},
  };

  admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
}
const directory = path.join(__dirname, 'images', 'kunddli');

function deleteFiles() {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Unable to scan directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        } else {
          console.log(`Deleted file: ${filePath}`);
        }
      });
    });
  });
}


// app.use(session({secret: 'ssshhhhh'}));
// // ============================ Working login with data base _ anand  ===================================
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE;

const MongoStore = require('connect-mongodb-session')(session);
const store = new MongoStore({
  uri: DB,
  collection: 'admin-sessions',
  expires: 1000 * 60 * 60 * 24,
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
  },
});

store.on('error', function (error) {
  console.error('Session store error:-----------------------', error);
});

app.use(
  session({
    secret: 'ssshhhhh',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 5 * 60 * 60 * 1000 },
  })
);
// // ============================ end  ===================================

var cors = require('cors');
app.use(cors());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  })
);
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  res.locals.admin = req.session.admin;
  delete req.session.message;
  next();
});
app.get('/', async function (req, res) {
  return res.redirect('/auth/login');
});
// app.use( (req, res, next) => {
//     var report_type1 = req.body.key_url ?? "";
//     console.log(report_type1);
//    // var key = req.body.key_url;
//   //   if (url == '/auth/login') {
//   //     next();
//   // }else{
//   //   if(!req.session.admin) {
//   //       res.redirect('/auth/login');
//   //   }else{
//   //       next();
//   //   }
//   // }
// });

app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);
app.use(bodyparser.json());

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/logo', express.static(__dirname + '/logo'));

app.set('views', path.join(__dirname, '/views/'));
app.engine(
  'hbs',
  exphbs({
    extname: 'hbs',
    defaultLayout: 'mainLayout',
    layoutsDir: __dirname + '/views/layouts/',
  })
);
app.set('view engine', 'hbs');

app.listen(3000, () => {
  console.log('Express server started at port : 3000');
});
///------------------------ADMIN ---------------------------
const employeeController = require('./controllers/adminController');
const authController = require('./controllers/authController');
const astrologerController = require('./controllers/astrologerController');
const userController = require('./controllers/userController');
const cmsController = require('./controllers/cmsController');
const serviceController = require('./controllers/serviceController');
const AgoraServer = require('./controllers/AgoraServer');

app.use('/admin', employeeController);
app.use('/auth', authController);
app.use('/astrologer', astrologerController);
app.use('/user', userController);
app.use('/cms', cmsController);
app.use('/service', serviceController);
app.use('/agora-server', AgoraServer);

///------------------------API ------------------------------
const userAPIController = require('./controllers/webservice/userAPIController');
app.use('/user_api', userAPIController);
const astrologerAPIController = require('./controllers/webservice/astrologerAPIController');
app.use('/astrologer_api', astrologerAPIController);
const webAPIController = require('./controllers/webservice/webAPIController');
app.use('/web', webAPIController);
