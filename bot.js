// =========================================================
// Bot required modules and functions
// =========================================================
/**
 * Require from node modules
 */
const builder = require('botbuilder');
const restify = require('restify');
const request = require('superagent');
const fetchUrl = require("fetch").fetchUrl;
const moment = require('moment'); //parsing support
const _ = require('lodash');
const request2 = require('request');
const locationDialog = require('botbuilder-location');
/**---------------------------- */


/**
 * Require from local files
 * 
 * 1-Functions:
 */
const {
    sendVerificationCode,
    verifyCode
} = require('./functions/digits');
const {
    fetchPost,
    fetchCategories,
    fetchSubCategories,
    fetchproviders,
    fetchMyAppointments,
    allProvidersList,
    getFacebookUserProfile
} = require('./functions/fetchData');
const {
    signUp,
    setUserData,
    logout
} = require('./functions/account');
const {
    makeAppointment,
    confirmMyAppointment
} = require('./functions/makeAppointment');
const {
    saveUserData,
    getUserData
} = require('./functions/persistantData');
const {
    discoverCategories,
    feedback,
    getStarted
} = require('./functions/specialFunctions');

const {
    createPassword
} = require('./cryptojs/createPassword');
/**----------------------------------------- */
/**
 * 2-Keys
 * Getting the keys we want to use with luis and bot framework services
 */
const {
    appId,
    appPassword,
    luisAppID,
    luisApiKey,
    luisUrl,
    PAGE_ACCESS_TOKEN,
    testingId,
    testingPassword,
    testingPageAccessToken,
    bingMapsApiKey
} = require('./keys');

/**------------------------ */
/**
 * 3-i18n
 */
const initI18n = require('./i18n/init');
/**------------------------- */
/**
 * 4-dialogs function
 * Getting all needed dialog functions
 */
const dialogFunctionsPath = './functions/dialogFunctions';
const hello = require(`${dialogFunctionsPath}/hello`);
const getLanguage = require(`${dialogFunctionsPath}/detectLanguage`);
const welcome = require(`${dialogFunctionsPath}/welcome`);
const entryChoices = require(`${dialogFunctionsPath}/entryChoices`);
const categoryChoice = require(`${dialogFunctionsPath}/categoryChoice`);
const detectUserEntryChoice = require(`${dialogFunctionsPath}/detectUserEntryChoice`);
const subcategoryChoice = require(`${dialogFunctionsPath}/subcategoryChoice`);
const providerChoice = require(`${dialogFunctionsPath}/providerChoice`);
const appointmentTimeRequest = require(`${dialogFunctionsPath}/appointmentTimeRequest`);
const detectVerifyCodeChoice = require(`${dialogFunctionsPath}/detectVerifyCodeChoice`);
const verifyEnteredCode = require(`${dialogFunctionsPath}/verifyEnteredCode`);
const callVerificationService = require(`${dialogFunctionsPath}/callVerificationService`);
const signUpSetUserDataMakeAppointment = require(`${dialogFunctionsPath}/signUpSetUserDataMakeAppointment`);
const phoneNumberPrompt = require(`${dialogFunctionsPath}/phoneNumberPrompt`);
const timePrompt = require(`${dialogFunctionsPath}/timePrompt`);
const datePrompt = require(`${dialogFunctionsPath}/datePrompt`);
const detectDateTimeEntities = require(`${dialogFunctionsPath}/detectDateTimeEntities`);
const missingDate = require(`${dialogFunctionsPath}/missingDate`);
const missingTime = require(`${dialogFunctionsPath}/missingTime`);
const missingPhoneNumber = require(`${dialogFunctionsPath}/missingPhoneNumber`);
const saveGetUserData = require(`${dialogFunctionsPath}/saveGetUserData`);
const nearestFreeTimeOptions = require(`${dialogFunctionsPath}/nearestFreeTimeOptions`);
const nearestFreeTimeResponse = require(`${dialogFunctionsPath}/nearestFreeTimeResponse`);
const nearestTimeToUserOptions = require(`${dialogFunctionsPath}/nearestTimeToUserOptions`);
const nearestTimeToUserResponse = require(`${dialogFunctionsPath}/nearestTimeToUserResponse`);
const phoneNumberDecisionNode = require(`${dialogFunctionsPath}/phoneNumberDecisionNode`);
const cancelAppointment = require(`${dialogFunctionsPath}/cancelAppointment`);
const confirmAppointment = require(`${dialogFunctionsPath}/confirmAppointment`);
const location = require(`${dialogFunctionsPath}/location`);
const missingDateResponse = require(`${dialogFunctionsPath}/missingDateResponse`);
const missingTimeResponse = require(`${dialogFunctionsPath}/missingTimeResponse`);
const phonePromptResponse = require(`${dialogFunctionsPath}/phonePromptResponse`);
const introductionCard = require(`${dialogFunctionsPath}/introductionCard`);
const about = require(`${dialogFunctionsPath}/about`);
const appointmentList = require(`${dialogFunctionsPath}/appointmentList`);
const rescheduleAppointment = require(`${dialogFunctionsPath}/rescheduleAppointment`);
const confirmChoices = require(`${dialogFunctionsPath}/confirmChoices`);
const cofirmChoicesResponse = require(`${dialogFunctionsPath}/cofirmChoicesResponse`);
const makeAppointmentIntent = require(`${dialogFunctionsPath}/makeAppointmentIntent`);
const finalDate = require(`${dialogFunctionsPath}/finalDate`);
const changeLanguageResponse = require(`${dialogFunctionsPath}/changeLanguageResponse`);
const appointmentListIntent = require(`${dialogFunctionsPath}/appointmentListIntent`);



/**----------------------------- */
const LISTENING_PORT = 8445;
const SARA_BOT_IMAGE_URL = "https://s3.eu-central-1.amazonaws.com/appointments-sara/sara-bot.png";




// =========================================================
// Bot setup
// =========================================================
//Creating a restify server
const server = restify.createServer();
//listening on the port we want 
server.listen(LISTENING_PORT, () =>
    console.log('%s listening to %s', server.name, server.url)
);

//Creating chat connector using the bot builder module
const connector = new builder.ChatConnector({
    appId,
    appPassword
});

//connecting the connector with our server
server.post('/api/messages', connector.listen());


//Defining the bot object
const bot = new builder.UniversalBot(connector);

bot.library(locationDialog.createLibrary(bingMapsApiKey));

//Defining the translation (localization) object
var i18n = initI18n("en"); //default to english

//Defining the luis recognizer
const luisModelUrl = `https://${luisUrl}/${luisAppID}?subscription-key=${luisApiKey}&verbose=true&spellCheck=true`;
// understand user intents using cloud based intent recognition services like LUIS
const recognizer = new builder.LuisRecognizer(luisModelUrl);
const intents = new builder.IntentDialog({
    recognizers: [recognizer]
}); //framework to know the user intent

//a function for sending proactive message

bot.beginDialogAction('confirmChoices', '/confirmChoices');
bot.beginDialogAction('getstarted', '/getstarted');
bot.beginDialogAction('main', '/Hello');
bot.beginDialogAction('about', "/bot'sName");
bot.beginDialogAction('help', '/help');
bot.beginDialogAction('logout', '/logout');
bot.beginDialogAction('changePhoneNumber', '/phonePrompt');
bot.beginDialogAction('changeLanguage', '/changeLanguage');
bot.beginDialogAction('cancelAppointment', '/cancelAppointment');
bot.beginDialogAction('confirmAppointment', '/confirmAppointment');
bot.beginDialogAction('rescheduleAppointment', '/rescheduleAppointment');

server.use(restify.bodyParser());
server.post('/api/notify', function (req, res) {
    console.log('recieving notifications', req.params);
    // Process posted notification
    if (!req || !req.params || !req.params.address) {
        res.status(200);
        return res.end('cant find the address');
    }
    var address = JSON.parse(req.params.address);
    var appointmentId = req.params.appointmentId;
    var notification = req.params.notification;
    var fbId = req.params.fbId;
    var msg = new builder.Message().address(address).text('action?confirmChoices=' + JSON.stringify({ appointmentId, notification }));
    //console.log({ msg, address: JSON.stringify(address) });
    bot.receive(msg.toMessage());
    // Send notification as a proactive message
    res.status(200);

    /*bot.beginDialog(address, '/confirmChoices', {
        appointmentId,
        notification
    });*/
    res.end('success');
    // });
    console.log('inside notify');
});

//=========================================================
// Facebook setup // Run only when need updating.
//=========================================================

// define the dialog itself
bot.dialog('/getstarted', [
    //get user profile information and save them in Microsoft framework.
    (session, args, next) => {
        //console.log("=== DIALOG: GETPROFILE | STEP: 1/1 ====");
        // Store the returned user page-scoped id (USER_ID) and page id
        session.userData.userid = session.message.sourceEvent.sender.id;
        session.userData.pageid = session.message.sourceEvent.recipient.id;
        // Let the user know we are 'working'
        session.sendTyping();
        console.log('*******');
        // Get the users profile information from FB
        getFacebookUserProfile(session.userData.userid).then(function (result) {
            console.log('getFacebookUserProfile', result);
            // Save profile to userData
            session.userData.firstname = result.first_name;
            session.userData.lastname = result.last_name;
            session.userData.profilepic = result.profile_pic;
            session.userData.locale = result.locale;
            session.userData.timezone = result.timezone;
            session.userData.gender = result.gender;
            var address = session.message.address;
            var fbId = session.message.user.id;
            saveUserData(address, fbId, {
                firstname: session.userData.firstname,
                locale: session.userData.locale,
                timezone: session.userData.timezone
            }).then(function (response) {
                next();
            }).catch(function (error) {
                console.log({
                    error
                });
            });
        }).catch(function (error) {
            console.log('getFacebookUserProfile error', error);
        })

    },
    (session) => {
        session.beginDialog('/Hello');
    }
]);

facebookThreadAPI('./fb-persistent-menu.json', 'Persistent Menu');
facebookThreadAPI('./fb-get-started-button.json', 'Get Started Button');

function facebookThreadAPI(jsonFile, cmd) {
    // Start the request
    request2({
        url: `https://graph.facebook.com/v2.6/me/thread_settings?access_token=${PAGE_ACCESS_TOKEN}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        form: require(jsonFile)
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(cmd + ": Updated.");
                console.log(body);
            } else {
                // TODO: Handle errors
                console.log(cmd + ": Failed. Need to handle errors.");
                console.log(body);
            }
        });
}




// =========================================================
// Bot intents
// =========================================================
/**
 * Here we will begin defining 
 * the dialogs and intents
 */
bot.dialog('/', intents);



/*intents.onBegin(function (session,args,next){
session.send(i18n.__("Welcome {{name}}", {
            name: session.message.user.name}));
            next();
})*/
intents
    .matches('AskForDate', '/AskForDate')
    /**------------End of the AskForDate intent--------------------- */
    .matches('None',
    (session) => {
        if (session.privateConversationData.step === 'appointmentTimeRequest') {
            session.send(i18n.__("Nothing"));
        } else
            session.beginDialog('/Hello');
    })
    /**
     * The hello intent
     */

    //user types make appointment or book appointment
    .matches('MakeAppointment', '/MakeAppointment')
    //hi or hello or السلام عليكم , it will return the entry choices
    .matches('Hello', '/Hello')
    //when user types help, it will return how user can talk with Sara
    .matches('help', '/help')
    //if user asks about Sara's age
    .matches('age', '/age')
    //when user asks about Sara's name,it will return the about dialog
    .matches("bot'sName", "/bot'sName")
    //if user thanks Sara
    .matches("thanks", "/thanks")
    //user said bye
    .matches("bye", "/bye")
    //user types how are you?
    .matches("howAreYou", '/howAreYou')
    //user types stop
    .matches("stop", '/stop')
    //user types list my appointment 
    .matches("appointmentList", '/appointmentList')


// =========================================================
// Bot dialogs
// =========================================================
// Define the event when action 'Profile' is called via the HeroCard button
// When action 'cancelAppointment' is called, dialog '/cancelAppointment' will be added to the Dialog Stack


bot.dialog('/Hello', [ //if the intent did not recognized this default will be invoked

    //Begin the conversation with a hello
    hello,

    //detect the language from the user input,
    getLanguage,

    //Welcome the user by his name or ask him about his name
    welcome,

    (session) => {
        session.beginDialog('/introductionCard')
    },


    //Give the user the available choices
    //basically we have 2 choices: "make appointment","my appointments"
    entryChoices,
    //detect the choice of the user
    /**
     * Here we have to handle 2 cases
     * 1-make an appointment
     * 2-view my appointments
     * For now we are handling only
     * the first case, so we will bring the categories
     * and let the user choose
     * We have only "Medecine" in categories right now
     */
    detectUserEntryChoice,

]);
/**------------End of the hello dialog--------------------- */


bot.dialog('/appointmentProcess', [
    //displaying all categories choices
    categoryChoice,

    //displaying all subcategories inside the choosen categoryChoice
    subcategoryChoice,
    //get user's location to fetch nearby providers
    location,
    //diplaying nearby providers inside the choosen subcategory
    providerChoice,

    //ask the user for the time of the appointment he want to reserve
    appointmentTimeRequest
])
bot.dialog('/askName', [ //we update the send name so the bot can save name using userData
    (session) => {
        builder.Prompts.text(session, (i18n.__('AskName')));
    },
    //the output will be saved in session 
    (session, results) => {
        session.userData.name = results.response;
        session.endDialog(); // 
    }
]);

bot.dialog('/date', [

    (session) => {
        var maxRetries = {
            maxRetries: 0
        };
        builder.Prompts.choice(session, i18n.__("retime"), [i18n.__("enter the date"), i18n.__("cancel button")], maxRetries, {
            listStyle: builder.ListStyle.button
        });
    },
    //in case the user forgets to enter the date of the appointment, we will ask him about it and save it .
    missingDateResponse
]);

bot.dialog('/enterTheDate', [
    //
    (session) => {
        builder.Prompts.time(session, (i18n.__("which date?")));
    },
    datePrompt
]);

bot.dialog('/time', [
    (session) => {
        var maxRetries = {
            maxRetries: 0
        };
        builder.Prompts.choice(session, i18n.__("didn't understand the time"), [i18n.__("enter the time"), i18n.__("cancel button")], maxRetries, {
            listStyle: builder.ListStyle.button
        });
    },
    //in case the user forgets to enter the time of the appointment, we will ask him about it and save it .
    missingTimeResponse
]);

bot.dialog('/enterTheTime', [
    (session) => {
        builder.Prompts.time(session, (i18n.__("which time?")));
    },
    timePrompt
]);

bot.dialog('/phonePrompt', [
    (session) => {
        var maxRetries = {
            maxRetries: 0
        };
        builder.Prompts.choice(session, i18n.__("I need your phone number to definite your reservation"), [i18n.__("Enter phone number"), i18n.__("Bypass this step")],
            maxRetries, {
                listStyle: builder.ListStyle.button
            })
    },
    phonePromptResponse,
    //detect if phone number is a valid phone number, contains only numbers and matching the standard length
    phoneNumberPrompt
]);

bot.dialog('/codePrompt', [
    //giving user choices for verification code 1. resend , 2.enter the code 3. or cancel
    (session) => {
        var maxRetries = {
            maxRetries: 0,
        };
        builder.Prompts.choice(session, i18n.__("verify code"), [i18n.__("resend"), i18n.__("Call me"), i18n.__("enter the code"), i18n.__("cancel button")],
            maxRetries, {
                listStyle: builder.ListStyle.button
            });
    },
    //detection of user's choice and reacting according to the choice 
    //e.g : if he/she chooses to resend the code, we will call the verfication service again etc..
    detectVerifyCodeChoice,
    //otherwis if the choice was enter the code , we will verify the code using digits 
    verifyEnteredCode
]);

bot.dialog('/verificationService',
    //we will send the phone number to verification service on digit , and it will send the verification code to it . 
    callVerificationService
);

bot.dialog('/signup',
    //sign Up with using user phone number + password , after gitting AuthToken and userId from the server ,
    // then we can make appointment based on provider Id , and Date .
    signUpSetUserDataMakeAppointment
);

bot.dialog('/nearestFreeTime', [
    //giving user the nearest time he can make appointment with chosen provider, with choices : 1. Book 2.enter another time 3.cancel
    nearestFreeTimeOptions,
    //handling the user choice, 
    //1. book = sign up with date .
    //2. enter another time = appointment time request dilog asking user for his preferred time. 3.or cancel.
    nearestFreeTimeResponse
]);


bot.dialog('/appointmentTimeRequest',
//if user want to book appointment with a provider and didn't typed the date, Sara will ask him about the date and time.
    (session, results, next) => {
        var doctorsName;
        if (session.privateConversationData.doctor) {
            doctorsName = session.privateConversationData.doctor.entity
        } else doctorsName = session.privateConversationData.provider;
        builder.Prompts.time(session, i18n.__("Time {{doc}}", {
            doc: doctorsName
        }))
        next();
    });

bot.dialog('/nearestTimeToUser', [
    //if the chosen time by user is already reserved, we will reply with the nearest time to him,
    // with choices to book , choose another time , or cancel 
    nearestTimeToUserOptions,
    //handling the response of user, if he/she choses to book, or enter another date or cancel .

    nearestTimeToUserResponse
]);
//introduction card with iformation about Sara, and the entry choices
bot.dialog('/introductionCard', [
    introductionCard
]);

//information about Sara
bot.dialog("/bot'sName", [
    about
]);
//list of appointments
bot.dialog('/carouselCards', [
    appointmentList
]);
bot.dialog('/cancelAppointment', [
    //we will cancel the appointment
    //then return to the appointments carousel
    cancelAppointment
]);
bot.dialog('/confirmAppointment', [
    //we will cancel the appointment
    //then return to the appointments carousel
    confirmAppointment
]);

bot.dialog('/rescheduleAppointment', [
    rescheduleAppointment
    //ask the user for the time of the appointment he want to reserve
]);
bot.dialog('/confirmChoices', [
    //confirmation push notification options 
    confirmChoices,
    cofirmChoicesResponse
]);

bot.dialog('/logout',
//logout choice so user can change his phone number if he needs to.
    (session) => {
        logout(session.userData.userId, session.userData.AuthToken).then(function (response) {
            delete session.userData;
            session.endDialog(i18n.__("You have been loged out"));
        }).catch(function (error) {
            console.log('logout error', error);
        })
    })

bot.dialog('/help',
// Sara tells the user how he can talk to her
    (session) => {
        session.endDialog(i18n.__("you can say"));
    })
bot.dialog("/thanks",
    (session) => {
        session.endDialog(i18n.__("you're welcome"));
    })
bot.dialog('/age',
    (session) => {
        session.endDialog(i18n.__("never ask a lady about her age"));
    })
bot.dialog("/bye",
    (session) => {
        session.endDialog(i18n.__("bye"));
    })
bot.dialog('/howAreYou',
    (session) => {
        session.endDialog(i18n.__("fine"));
    })
bot.dialog('/stop',
    (session) => {
        session.send(i18n.__("The process ended"));
        session.endConversation();
    })

bot.dialog('/MakeAppointment', //user wants to book an appointment in only one sentence
    [
        //detect the etites of the sentence, date , time, and provider
        makeAppointmentIntent,
        //if no detected date
        missingDate,
        //no time
        missingTime,
        //save date and time in a finalDate variable
        finalDate,
        //if phone number of the user is saved or not 
        phoneNumberDecisionNode
    ])

bot.dialog('/AskForDate',
    [
        //detect date and time entities in separatly,and save them in different variables,
        detectDateTimeEntities,
        //if date is missing , move control to the date prompt to ask the user which date he wants .
        missingDate,
        //if time is missing , move control to the time prompt to ask the user which time he wants .
        missingTime,
        //save date and time in FinaleDate variable as an iso format
        finalDate,
        //if the bot doesn't know the phone number, we will send the user to the phoneNumber prompt,
        // to ask him about his phone number
        missingPhoneNumber,
        //1. parsing the date using moment, 
        //2. saving phone number from the phone prompte response, 
        //3.save and get user data inside the MS framework.
        saveGetUserData
    ])
bot.dialog('/changeLanguage',
    [
        //if the user wants to talk with Sara in a different language of his Facebook profile
        (session) => {
            builder.Prompts.choice(session, i18n.__("Which language do you prefer?"), [i18n.__("Arabic"), i18n.__("English")]);
        },
        changeLanguageResponse
    ])
bot.dialog('/appointmentList',
//user wants to see his appointments' list   
    appointmentListIntent);
