/*
By: Nikhail Kazak
*/
const Discord = require('discord.js')
var client = new Discord.Client()
var cron = require("cron")

const fs = require('fs')
client.usersToBeNotified = require ("./usersToBeNotified.json")
client.dateTime = require("./dateTime.json")
client.todaysEvents = require("./todaysEvents.json")

//Events on start up
client.on('ready', () => 
{
    //Outputs the bots tag, the date on startup, the time at startup
    console.log("Connected as " + client.user.tag)
    console.log("date = " + getDate())
    console.log("time = " + getTime())

    //Sets bot status
    client.user.setActivity("with your schedules", {type: "PLAYING"})

    //Displays the server name along with all channel name, type and id
    client.guilds.cache.forEach((guild) => 
    {
        console.log(guild.name)
        guild.channels.cache.forEach((channel) => 
        {
            console.log(` - ${channel.name} ${channel.type} ${channel.id}`)
        })
    })

    //Initial variables
    let generalChannel = client.channels.cache.get(/*insert your Channel id in place of posted channel id*/)
    let keys=Object.keys(client.todaysEvents)//sets keys in this function to the keys of todaysEvents
    var now         = new Date();
    let currHour    = parseInt(now.getHours());
    let currMinute  = parseInt(now.getMinutes());

    //Initial check for events on bot startup
    if(keys.length>0)//check if there are events in todaysEvents.json
    {
        deleteOldEvents() //if so, it'll check if the date and time are valid (the present or future) 
    }
    checkdateTime()//Checks if theres an event which occurs today and records it to todaysEvents.json
    
    //Will check for new events everyday at 57 seconds past every minute
    let scheduledCheck = new cron.CronJob('57 * * * * *', () => {
        if(keys.length>0)//check if there are events in todaysEvents.json
        {
            deleteOldEvents()//if so, it'll check if the date and time are valid (the present or future) 
        }
        if(currHour==0 && currMinute==0)
        {
            checkdateTime()//Checks if theres an event which occurs today and records it to todaysEvents.json
        }
        if(isThereAnEventToday()==true) //if there is an event
        {
            compareTime()//If it's within the next hour it will give the user an initial alert then it will alert the user in intervals at the 60/45/30/15/5/1 min remaining marks
        }
        
    })
    scheduledCheck.start()

    var checkHour = 60, interval = checkHour * 60 * 1000; //This checks if there's any additional participants in an event every 1 hour
    setInterval(function() {
        if(isThereAnEventToday()==true) //if there is an event
        {
            checkforAdditionalParticipants()
        }
    }, interval);

})

//Events after start up
client.on('message', (receivedMessage) => 
{
    if (receivedMessage.author==client.user)
    {
        return
    }
    
    //Prompts bot to take commands
    if(receivedMessage.content.startsWith("!"))
    {
        processCommand(receivedMessage)
    }
})

//Process's the commands
function processCommand(receivedMessage)
{
    //Removes the `!`
    let fullCommand = receivedMessage.content.substr(1)//Removes ! from command
    let splitCommand = fullCommand.split(" ")//Returns an array containing each word
    let primaryCommand = splitCommand[0]//Primary command
    let arguments = splitCommand.splice(1)//Excludes the primary command and includes everythings else

    //Defers user to the help function
    if(primaryCommand.toLowerCase() == "help")
    {
        helpCommand(arguments, receivedMessage)
    }
    //Defers user to the bookEventCommand function
    else if (primaryCommand.toLowerCase() == "bookevent")
    {
        bookEventCommand(arguments, receivedMessage)
    }
    //Defers user to the participatingCommand function
    else if (primaryCommand.toLowerCase() == "participate")
    {
        participatingCommand(arguments, receivedMessage)
    }
    //Defers user to the removeMeFromCommand function
    else if (primaryCommand.toLowerCase() == "removemefrom")
    {
        removeMeFromCommand(arguments, receivedMessage)
    }
    //Defers user to the deleteCommand function
    else if (primaryCommand.toLowerCase() == "deleteevent")
    {
        deleteCommand(arguments, receivedMessage)
    }
    //Defers user to the listMyEventsCommand function
    else if (primaryCommand.toLowerCase() == "listmyevents")
    {
        listMyEventsCommand(arguments, receivedMessage)
    }
    //Defers user to the listAllServerEventsCommand function
    else if (primaryCommand.toLowerCase() == "listallserverevents")
    {
        listAllServerEventsCommand(arguments, receivedMessage)
    }
    //Explains which commands are viable to the user
    else
    {
        receivedMessage.channel.send("Unknown command\nTo see which commands are viable type `!help commands`")
    }
}

//Allows a user to make a schedule
function bookEventCommand(arguments, receivedMessage)
{
    
    if(arguments.length <5)
    {
        receivedMessage.channel.send("You are missing an argument, please double check your input")
    }
    else if(arguments.length ==5 )
    {
        //Variables
        var event = arguments[0];
        var place = arguments[1];
        var cooperative = arguments[2];
        var time = arguments[3];
        var date = arguments[4];

        if(isValidDate(date) && isValidTime(time, date))
        {
            uniqueID=(receivedMessage.author.tag+generateUID())

            //Embeds the received info into a user friendly gui
            const embed = new Discord.MessageEmbed()
                .setAuthor(`Event '${event}' created`)
                .setColor(0xff0000)
                .addField('Time:', `${time}`)
                .addField('Date:', `${date}`)
                .addField('Other Participants:', `${cooperative}`)
                .addField('Place', `${place}`)
                .addField('Unique Identifier', `${uniqueID}`)

            if(event!=undefined && (time!=undefined && time.length==5) && (date!=undefined && date.length==10) && cooperative!=undefined && place!=undefined)
            {
                //Puts the info into an array
                embedArray=[event,date,time]
                
                eventDateTime=embedArray[0]+"-"+embedArray[1]+"-"+embedArray[2]

                objKeys=Object.keys(client.dateTime)
                let counter=0

                for(let x=0; x<objKeys.length; x++)
                {
                    if(objKeys[x] === eventDateTime)
                    {
                        counter++
                    }
                }

                if(counter==0)
                {
                    //Displays the info
                    receivedMessage.channel.send({embed})
                    receivedMessage.author.send({embed})
                    receivedMessage.author.send("This has been sent to you to inform you of the unique identifier assigned to this event")

                    let guild = "N/A"
                    if( (receivedMessage.guild)!=null )
                    {
                        guild = receivedMessage.guild.id
                    }

                    let chan = "N/A"
                    if( (receivedMessage.channel.id)!=null )
                    {
                        chan = receivedMessage.channel.id
                    }

                    //Records Date and Time of Event to JSON file dateTime.JSON
                    client.dateTime [eventDateTime] = {
                        eventTitle: event,
                        dateOfEvent: date,
                        timeOfEvent: time,
                        otherParticipants: cooperative,
                        whereIsTheEvent: place, 
                        author: receivedMessage.author,
                        serverID: guild,
                        uID: uniqueID,
                        channel: chan
                    }
                    fs.writeFile("./dateTime.json", JSON.stringify(client.dateTime, null, 4), err=>{
                        if(err) throw err;
                        receivedMessage.channel.send("Event logged\n");
                        receivedMessage.channel.send("For those who wish to participate in this event, please type `!participate " +  uniqueID + "`\n");
                    });

                    client.usersToBeNotified [eventDateTime] = {
                        participants:[receivedMessage.author],
                        bookedDate: date,
                        bookedTime: time,
                        otherParticipants: cooperative,
                        author: receivedMessage.author,
                        serverID: guild,
                        uID: uniqueID,
                        channel: chan
                    }
                    fs.writeFile("./usersToBeNotified.json", JSON.stringify(client.usersToBeNotified, null, 4), err=>{
                        if(err) throw err;
                        receivedMessage.channel.send("You and all participants will be notified in intervals at the 60, 45, 30, 15, 5 & 1 min remaining marks\n");
                    });
                    checkdateTime()
                }
                else{
                    receivedMessage.channel.send("An event by this name has already been booked")
                }
            }
            else
            {
                receivedMessage.channel.send("You left a field undefined, pls enter the command in the order of `!bookevent Event PlaceOfEvent AreThereGoingToBeOtherParticipants TimeOfEvent dateOfEvent(in the format of mm/dd/yyyy, i.e-> 12/1/2021)`")
            }
        }
        else
        {
            receivedMessage.channel.send("An invalid date or time was entered")
            receivedMessage.channel.send("If the date was invalid ensure to follow the format mm/dd/yyyy")
            receivedMessage.channel.send("If the time was invalid ensure to follow the format hh:mm")
        }

    }
    
}

//Adds participants to event
function participatingCommand(arguments, receivedMessage)
{
    let uniqueIdentifier = arguments[0]
    keys=Object.keys(client.usersToBeNotified)
    dateTimeValues=Object.values(client.dateTime)

    for(let x=0; x<Object.keys(client.usersToBeNotified).length; x++)
    {
        if( dateTimeValues[x].uID=== uniqueIdentifier)
        {
            if((dateTimeValues[x].otherParticipants).toLowerCase() === "yes")
            {
                values=Object.values(client.usersToBeNotified)
                let participatingGroup=values[x].participants
                let counter=0
                
                for(let y=0;y<participatingGroup.length;y++)
                {
                    if(receivedMessage.author.id === participatingGroup[y].id)
                    {
                        counter++
                    }
                }

                if(counter==0)
                {
                    participatingGroup.push(receivedMessage.author)
                    fs.writeFile("./usersToBeNotified.json", JSON.stringify(client.usersToBeNotified, null, 4), err=>{
                        if(err) throw err;
                        receivedMessage.channel.send("You will be notified in intervals at the 60, 45, 30, 15, 5 & 1 min remaining marks\n");
                    });
                    checkdateTime()
                }
                else{
                    receivedMessage.channel.send("It appears you've already sign up to participate in " + arguments[0])
                }
            }
            else{
                //console.log(dateTimeValues[x].otherParticipants)
                receivedMessage.channel.send("It appears other participants aren't allowed in this activity")
            }

        }
    }
}

//removes a user from a certain event
function removeMeFromCommand(arguments, receivedMessage)
{
    let uniqueIdentifier = arguments[0]
    keys=Object.keys(client.usersToBeNotified)
    dateTimeValues=Object.values(client.dateTime)

    for(let x=0; x<Object.keys(client.usersToBeNotified).length; x++)
    {
        if( dateTimeValues[x].uID=== uniqueIdentifier)
        {
            values=Object.values(client.usersToBeNotified)
            let participatingGroup=values[x].participants
            let position=-1
            
            for(let y=0;y<participatingGroup.length;y++)
            {
                if(receivedMessage.author.id === participatingGroup[y].id)
                {
                    position=y
                }
            }

            if(position>=0)
            {
                participatingGroup.splice(position,1)
                fs.writeFile("./usersToBeNotified.json", JSON.stringify(client.usersToBeNotified, null, 4), err=>{
                    if(err) throw err;
                    receivedMessage.channel.send("You have been removed from the event\n" + arguments[0]);
                });
                checkdateTime()
            }
            else{
                receivedMessage.channel.send("You cannot be removed from this event as you are not in " + arguments[0])
            }

        }
    }
}

//deletes an event
function deleteCommand(arguments, receivedMessage)
{
    let uniqueIdentifier = arguments[0]
    keys0=Object.keys(client.usersToBeNotified)
    keys1=Object.keys(client.dateTime)
    keys2=Object.keys(client.todaysEvents)
    dateTimeValues=Object.values(client.dateTime)

    for(let x=0; x<Object.keys(client.usersToBeNotified).length; x++)
    {
        if( dateTimeValues[x].uID=== uniqueIdentifier)
        {
            values=Object.values(client.usersToBeNotified)
            let participatingGroup=values[x].participants
            let eventAuthor=values[x].author
            let others=values[x].otherParticipants

            //if other participants are allowed & there are 0 people then anyone can delete. 
            //if other participants are allowed & there is 1 person then that 1 person can delete the event
            //if other participants aren't allowed then the event author can only delete the event
            if( (others.toLowerCase()=="yes" && participatingGroup.length==0) || (others.toLowerCase()=="yes" && participatingGroup.length==1 && receivedMessage.author.id==participatingGroup[0].id) || (others.toLowerCase()=="no" && (receivedMessage.author.id)==eventAuthor.id) )
            {
                delete (client.usersToBeNotified[keys0[x]])
                fs.writeFile("./usersToBeNotified.json", JSON.stringify(client.usersToBeNotified, null, 4), err=>{
                    if(err) throw err;
                    receivedMessage.channel.send("You have deleted the event\n");
                });
                delete (client.dateTime[keys0[x]])
                fs.writeFile("./dateTime.json", JSON.stringify(client.dateTime, null, 4), err=>{
                    if(err) throw err;
                });
                for(let y=0; y<keys2.length; y++)
                {
                    if( keys2[y]=== keys0[x])
                    {
                        delete (client.todaysEvents[keys0[x]])
                        fs.writeFile("./todaysEvents.json", JSON.stringify(client.todaysEvents, null, 4), err=>{
                            if(err) throw err;
                        });   
                    }
                }
                
            }
            else
            {
                receivedMessage.channel.send("If this is an event where participants are allowed, then there are people aside from you who want still want to do this")
            }
        }
    }
}

//Lists the events a user is in
function listMyEventsCommand(arguments, receivedMessage)
{
    keys=Object.keys(client.usersToBeNotified)
    arr=[]

    for(let x=0; x<keys.length; x++)
    {
        values=Object.values(client.usersToBeNotified)
        let participatingGroup=values[x].participants
        for(let y=0;y<participatingGroup.length;y++)
        {
            if(receivedMessage.author.id === participatingGroup[y].id)
            {
                arr.push(keys[x]+"/Unique Identifier: "+values[x].uID)
            }
        }
    }

    if(arr.length>0)
    {
        receivedMessage.author.send("You're participating in:\n")
        for(let z=0; z<arr.length; z++)
        {
            receivedMessage.author.send(arr[z])
        }
    }
    else{
        receivedMessage.author.send("You're not participating in any events\n")
    }
}

//If a user wants to see what events they can join/participate in this is how they check
function listAllServerEventsCommand(arguments, receivedMessage)
{
    keys=Object.keys(client.usersToBeNotified)
    values=Object.values(client.usersToBeNotified)
    arr=[]

    if( (receivedMessage.guild)!=null )
    {
        for(let x=0; x<keys.length; x++)
        {
            let sN=values[x].serverID
            let others=values[x].otherParticipants

            //console.log(guildIdentification)
            //console.log(sN)

            let guildIdentification = receivedMessage.guild.id
            if( (guildIdentification==sN) )
            {
                arr.push(keys[x]+"/Unique Identifier: "+values[x].uID)
            }
            
        }
        if(arr.length>0)
        {
            receivedMessage.author.send("All the events occurring in this server include:\n")
            for(let z=0; z<arr.length; z++)
            {
                receivedMessage.author.send(arr[z])
            }
        }
        else{
            receivedMessage.author.send("There are no events\n")
        }
    }
    else
    {
        receivedMessage.author.send("Sorry, I could not retrieve server specific events as you most likely requested this from your dm's\n")
    }
}

function checkdateTime()
{
    keys=Object.keys(client.usersToBeNotified)

    if(keys.length>0)
    {
        for(let x=0; x<keys.length; x++)
        {
            values=Object.values(client.usersToBeNotified)
            let participants=values[x].participants
            let dateOfEvent=values[x].bookedDate
            let timeOfEvent=values[x].bookedTime
            let auth=values[x].author
            let isThereOtherParticipants=values[x].otherParticipants
            let serverIdentification=values[x].serverID
            let uniqueIdentifier = values[x].uID
            let channelIdentifier = values[x].channel

            
            if(dateOfEvent.toString()==getDate().toString() && isValidTime(timeOfEvent, dateOfEvent))
            {
                client.todaysEvents [keys[x]] = {
                    participants:participants,
                    bookedDate: dateOfEvent,
                    bookedTime: timeOfEvent,
                    timesNotified: 0,
                    otherPeople: isThereOtherParticipants,
                    author: auth,
                    serverID: serverIdentification,
                    uID: uniqueIdentifier,
                    channel: channelIdentifier
                }
                fs.writeFile("./todaysEvents.json", JSON.stringify(client.todaysEvents, null, 4), err=>{
                    if(err) throw err;
                });
            }
        }
    }
    else{
        return(false)
    }
}

function isThereAnEventToday()
{
    keys=Object.keys(client.todaysEvents)

    if(keys.length>0)
    {
        return(true)
    }
    else{
        return(false)
    }
}

function compareTime()
{
    var now     = new Date(); 
    keys=Object.keys(client.todaysEvents)
    let currTime=getTime()
    let currHour    = now.getHours();
    let currMinute  = now.getMinutes();

    let currHourInToMinPlusMin=(parseInt(currHour))*60+parseInt(currMinute)

    for(let x=0; x<keys.length; x++)
    {
        values=Object.values(client.todaysEvents)
        let timeOfEvent=values[x].bookedTime
        let participatingGroup=values[x].participants
        let eventHour = timeOfEvent.slice(0,2)
        let eventMinute = timeOfEvent.slice(3)

        let eventHourInToMinPlusMin=(parseInt(eventHour*60))+parseInt(eventMinute)
        let timeDif=eventHourInToMinPlusMin-currHourInToMinPlusMin

        if( (timeDif<=60 && timeDif>=0) )
        {
            notifyUser(keys, values, participatingGroup, currHour, currMinute, eventHour, eventMinute, x, timeDif)
        }

    }
}

function notifyUser(keys, values, participatingGroup, currHour, currMinute, eventHour, eventMinute, x, timeDif)
{
    for(let y=0;y<participatingGroup.length;y++)
    {
        let ID = participatingGroup[y].id
        let mention = `<@${ID}>`;
        let arr=keys[x].split("-")

        client.users.fetch(ID).then((user)=> {
            if(eventHour>currHour)
            {
                let dif = 60-currMinute
                timeLeft = dif+parseInt(eventMinute)
                if(timeDif==60 || timeDif==45 || timeDif==30 || timeDif==15 || timeDif==5 || timeDif==1)
                {
                    user.send(mention + " This is a reminder that the event '" + arr[0] + "' is occurring in about "+ timeLeft + " minutes at "+ arr[2] +" hours")
                    
                }
                if(timeDif==0)
                {
                    if(values[x].channel!="N/A")
                    {
                        let id = values[x].channel
                        let dest = client.channels.cache.get(id)
        
                        dest.send("This is a notification that the event `" + keys[x] + "` has now started")
                    }   
                }
            }
            else
            {
                let dif = parseInt(eventMinute)-currMinute
                if(timeDif==60 || timeDif==45 || timeDif==30 || timeDif==15 || timeDif==1)
                {
                    user.send(mention + " This is a reminder that the event '" + arr[0] + "' is occurring in about "+ dif + " minutes at "+ arr[2] +" hours")

                }
                if(timeDif==0)
                {
                    if(values[x].channel!="N/A")
                    {
                        let id = values[x].channel
                        let dest = client.channels.cache.get(id)
        
                        dest.send("This is a notification that the event `" + keys[x] + "` has now started")
                    }   
                }
            }
            values[x].timesNotified+=1
            fs.writeFile("./todaysEvents.json", JSON.stringify(client.todaysEvents, null, 4), err=>{
                if(err) throw err;
            });
        })
    }
}

function deleteOldEvents()
{
    keys=Object.keys(client.todaysEvents)
    values=Object.values(client.todaysEvents)
    
    for(let x=0; x<keys.length; x++)
    {   
        let timeOfEvent=values[x].bookedTime
        let dateOfEvent=values[x].bookedDate
        let participatingGroup=values[x].participants

        if(isValidTime(timeOfEvent, dateOfEvent)==false)
        {
            delete (client.usersToBeNotified[keys[x]])
            delete (client.dateTime[keys[x]])
            delete (client.todaysEvents[keys[x]])

            
        }
    }
    fs.writeFile("./usersToBeNotified.json", JSON.stringify(client.usersToBeNotified, null, 4), err=>{
        if(err) throw err;
    });
    fs.writeFile("./dateTime.json", JSON.stringify(client.dateTime, null, 4), err=>{
        if(err) throw err;
    });
    fs.writeFile("./todaysEvents.json", JSON.stringify(client.todaysEvents, null, 4), err=>{
        if(err) throw err;
    });
}

function generateUID()
{
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    var milliseconds = now.getMilliseconds();

    if(month.toString().length == 1) {
        month = '0'+month;
    }
    if(day.toString().length == 1) {
            day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
            minute = '0'+minute;
    } 
    if(second.toString().length == 1) {
        second = '0'+second;
    }
    if(milliseconds.toString().length == 1) {
        milliseconds = '00'+milliseconds;
    } 
    if(milliseconds.toString().length == 2) {
        milliseconds = '0'+milliseconds;
    } 

    return(year.toString()+month.toString()+day.toString()+hour.toString()+minute.toString()+second.toString()+milliseconds.toString())
}

function checkforAdditionalParticipants()
{
    keys=Object.keys(client.todaysEvents)
    values=Object.values(client.todaysEvents)

    var now     = new Date();
    let currHour    = now.getHours();
    let currMinute  = now.getMinutes();

    let currHourInToMinPlusMin=(parseInt(currHour))*60+parseInt(currMinute)
    

    for(let x=0; x<keys.length; x++)
    {
        let participatingGroup=values[x].participants
        let eventAuthor=values[x].author
        let others=values[x].otherPeople
        let timeOfEvent=values[x].bookedTime
        let eventHour = timeOfEvent.slice(0,2)
        let eventMinute = timeOfEvent.slice(3)

        let eventHourInToMinPlusMin=(parseInt(eventHour*60))+parseInt(eventMinute)
        let timeDif=eventHourInToMinPlusMin-currHourInToMinPlusMin
        
        if(others.toLowerCase()=="yes" && values[x].channel!="N/A")
        {
            if(timeDif<=240)
            {
                if(participatingGroup.length==1 && participatingGroup[0].id==eventAuthor.id)
                {
                    //console.log("true")
                    let id = values[x].channel
                    let dest = client.channels.cache.get(id)

                    dest.send("This is a notification that currently only the event author has opted to participate in `" + keys[x] +"`\n" + "If you wish to join please type `!participate " + values[x].uID + "`")
                }
                else
                {
                    //console.log("false")
                }
            }
        }
    }
}

//Allows the user to prompt for help
function helpCommand(arguments, receivedMessage)
{
    //Explains to the user what they can request help with
    if(arguments.length == 0)
    {
        receivedMessage.channel.send("Try `!help argument`, arguments include:")
        receivedMessage.channel.send("```1) bot - gives a brief description as to the bots purpose```")
        receivedMessage.channel.send("```2) commands - provides a list of viable commands which the bot will accept ```")
        receivedMessage.channel.send("```3) <Name of Command> - provides a breakdown of reuqired arguments given the command```")
    }
    //Offers the users a brief explanation of the bot's purpose
    else if (arguments.toString().toLowerCase() == "bot")
    {
        receivedMessage.channel.send("```This bot, created by Nikhail Kazak, serves the main purpose of scheduling events and notifying participants on a timely basis```")
    }
    //Offers the user the capability to find out which other commands exist
    else if (arguments.toString().toLowerCase() == "commands")
    {
        receivedMessage.channel.send("```Commands include: \n!bookevent \n!participate \n!removemefrom \n!deleteevent \n!listmyevents \n!listAllServerEvents ```")
    }
    //Offers the user the capability to find out what bookevent does
    else if (arguments.toString().toLowerCase() == "bookevent")
    {
        receivedMessage.channel.send("To book an event type `!bookevent eventName placeOfEvent isAnybodyElseParticipating(yes/no) Time(hh:mm) Date(mm/dd/yyyy)`\nAnd the bot provides the user with a nice user friendly embed")
        receivedMessage.channel.send("It is mandatory that the date be entered in the mm/dd/yyyy format and time should be anywhere from 00:00 to 23:59")
        receivedMessage.channel.send("For the date to be considered valid the event must take place in the present or the future")
        receivedMessage.channel.send("For the time to be considered valid the event must take place right now at absolute earliest, i.e if it's 08:50 the event must take place at 08:50 (at absolute earliest) or a later time")
        receivedMessage.channel.send("For optimal results it is however encouraged that you book an event at least an hour in advance")
    }
    //Offers the user the capability to find out what participate does
    else if (arguments.toString().toLowerCase() == "participate")
    {
        receivedMessage.channel.send("To participate in an event type `!participate <uniqueIdentifier>`\n")
        receivedMessage.channel.send("It is important to note that <uniqueIdentifier> is a placeholder meant to be replaced by an identifier assigned to an event")
        receivedMessage.channel.send("If an event already exists by that name at the same time and day, the user will be notified and they will have to join that one")
    }
    //Offers the user the capability to find out what removemefrom does
    else if (arguments.toString().toLowerCase() == "removemefrom")
    {
        receivedMessage.channel.send("To remove yourself from an event type `!removemefrom <uniqueIdentifier>`\n")
        receivedMessage.channel.send("It is important to note that <uniqueIdentifier> is a placeholder meant to be replaced by an identifier assigned to an event")
        receivedMessage.channel.send("If the user is not in the event already, the user will be notified if they attempt this command. However, if the user is in the event and they do this, they'll be removed from the list of participants")
    }
    //Offers the user the capability to find out what deleteevent does
    else if (arguments.toString().toLowerCase() == "deleteevent")
    {
        receivedMessage.channel.send("To delete an event type `!deleteevent <uniqueIdentifier>`\n")
        receivedMessage.channel.send("It is important to note that <uniqueIdentifier> is a placeholder meant to be replaced by an identifier assigned to an event")
        receivedMessage.channel.send("If an event by this name exists, the user will be notified that it has been deleted. If one does not exist by this name there will be no notification")
    }
    //Offers the user the capability to find out what listmyevents does
    else if (arguments.toString().toLowerCase() == "listmyevents")
    {
        receivedMessage.channel.send("To list all the events you're participating in type `!listmyevents`\n")
        receivedMessage.channel.send("If you're in 1 or more events you'll receive a list of events you're participating in")
    }
    //Offers the user the capability to find out what listAllServerEvents does
    else if (arguments.toString().toLowerCase() == "listallserverevents")
    {
        receivedMessage.channel.send("To list all the active events in this server type `!listAllServerEvents`\n")
        receivedMessage.channel.send("If there are events you'll get a list of all the events currently scheduled within this server. If there are no events then the user will be notified")
    }
    //If the user accidentally types a invalid command, it prompts the user to revisit the possible commands
    else
    {
        receivedMessage.channel.send("Unknown command\nTo see which commands are viable type `help commands`")   
    }
}

function getDate()
{
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    if(month.toString().length == 1) {
            month = '0'+month;
    }
    if(day.toString().length == 1) {
            day = '0'+day;
    }   
    var date = month+'/'+day+'/'+year;
    return date;
}

function getTime()
{
    var now     = new Date(); 
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    if(hour.toString().length == 1) {
            hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
            minute = '0'+minute;
    } 
    var time = hour+':'+minute;   
    return time;
}

function isValidDate(dateObj)
{
    var parts= dateObj.split("/");
    var month= parseInt(parts[0]), day=parseInt(parts[1]), year=parseInt(parts[2]);
    var daysInMonth= new Date(year, month, 0).getDate();

    var currDate=getDate().split("/");
    var cMonth= parseInt(currDate[0]), cDay=parseInt(currDate[1]), cYear=parseInt(currDate[2]);
    var daysInCMonth= new Date(cYear, cMonth, 0).getDate();

    if(year>cYear)
    {
        if(month>0 && month <13)
        {
            if(day>0 && day<=daysInMonth)
            {
                return true;
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
    }
    else if(year==cYear)
    {
        if(month>cMonth && month<13)
        {
            if(day>0 && day<=daysInMonth)
            {
                return true;
            }
            else{
                return false;
            }
        }
        else if(month==cMonth)
        {
            if(day>=cDay && day<=daysInCMonth)
            {
                return true;
            }
            else
            {
                return false
            }
        }
        else
        {
            return false
        }
    }
    else{
        return false;
    }
}

function isValidTime(timeObj, dateObj)
{
    var parts= timeObj.toString().split(":");
    var hour=parseInt(parts[0]);
    var min=parseInt(parts[1]);

    if(min==null)
    {
        min=00;
    }

    var currTime=getTime().split(":");
    var cHour= parseInt(currTime[0]), cMin=parseInt(currTime[1]);
    //console.log(cHour, cMin+10, hour, min)
    
    if((hour>=0 && hour<24) && (min>=0 && min<60))
    {
        if(isSameDay(dateObj)==false)
        {
            return true;
        }
        else{
            if(hour>cHour)
            {
                return true
            }
            else if(hour==cHour)
            {
                if(min>=cMin)
                {
                    return true;
                }
                else{
                    return false;
                }
            }
            else
            {
                return false;
            }
        }
    }
    else{
        return false;
    }    
}

function isSameDay(dateObj)
{
    var parts= dateObj.split("/");
    var month= parseInt(parts[0]), day=parseInt(parts[1]), year=parseInt(parts[2]);
    var daysInMonth= new Date(year, month, 0).getDate();

    var currDate=getDate().split("/");
    var cMonth= parseInt(currDate[0]), cDay=parseInt(currDate[1]), cYear=parseInt(currDate[2]);
    var daysInCMonth= new Date(cYear, cMonth, 0).getDate();


    if(year>cYear)
    {
        if(month>0 && month <13)
        {
            if(day>0 && day<=daysInMonth)
            {
                return false;
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
    }
    else if(year==cYear)
    {
        if(month>cMonth && month<13)
        {
            if(day>0 && day<=daysInMonth)
            {
                return false;
            }
            else{
                return false;
            }
        }
        else if(month==cMonth)
        {
            if(day>cDay && day<=daysInCMonth)
            {
                return false;
            }
            else if(day==cDay && day<=daysInCMonth)
            {
                return true;
            }
            else
            {
                return false
            }
        }
        else
        {
            return false
        }
    }
    else{
        return false;
    }
}


client.login(/*Enter your token as a string here*/)