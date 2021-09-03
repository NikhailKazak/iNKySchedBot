Author: Nikhail Kazak

Version: 1.1

Published on Sept 3rd, 2021

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Purpose:
   1) This bot, known as iNKySchedBot, is a scheduling bot. It can book an event, add additional users as participants to events, help individuals remove
      themselves as participants from an event, and delete an event.  

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Features:
   1) Events can only be scheduled if:
       a) At earliest, the event takes place at the current hour and current minute it is booked... The hour and minute is formatted as hh:mm
       b) At earliest, the event takes place today, in regards to the month/day/year... Today's date mm/dd/yyyy is valid
       c) Disclaimer: any time/date in the present(taking the above into consideration) and the future is valid 

   2) Once an event takes place and is over, the booking is then automatically removed from system so that it does not un-necessarily consume space

   3) The bot (iNky) will dm every participant on a 10 minute basis, 1 hour prior to the event
       a) Disclaimer: The 10 minute basis can be increased or decreased, this can be done by changing the checkminutes variable on line 56
       b) Disclaimer: The 1 hour mark can be increased or decreased by changing the 60 value on line 473

   4) If an unknown command is attempted the bot will instruct the user as to how they can use the bot 

   5) A user can delete an event prior to its expiry on 2 conditions
       a) If it's an event where other participants are allowed, then they have to be the only participant in it to delete the event without needing to remove themselves from it
       b) If it's an event where there are no other participants allowed then only the author of the event can delete the event without needing to remove themselves from it

   6) If an event where partipants are allowed takes place, but no participants have joined 6 hours prior to the start of the event then the bot will send out a message stating 
      that said event will be taking place and that people are allowed to participate 

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Possible Commands and purpose:

   1) !help - gives a general synopsis of possible commands

   2) !help bot - gives a general synopsis about the bot and its' purpose

   3) !help commands - gives a general synopsis of what commands are possible/can be inquired about

   4) !help bookevent - gives a general synopsis on how to book an event

   5) !help participate - gives a general synopsis on how to participate in an event

   6) !help deleteevent - gives a general synopsis on how to delete an event

   7) !help listmyevents - gives a general synopsis on how to list a persons events

   8) !help listallserverevents - gives a general synopsis on how to list all the events of 1 server

   9) !bookevent NameOfEvent PlaceOfEvent isAnybodyElseParticipating(yes/no) StartingTime(hh:mm) Date(mm/dd/yyyy) - books an event if the arguments are valid and will produce a      user friendly embed with an event UID

       a) Ex: !bookevent TimsBday TimsHouse yes 21:15 11/01/2035

   10) !partcipate UID - adds a participant to an event given that participants are allowed 

       a) Ex: !participate T1M#727120210826180012749

   11) !deleteevent UID - deletes an event given that certain criteria are met

       a) Ex: !deleteevent T1M#727120210826180012749

   12) !listmyevents - lists all the active events the message author is partcipating in regardless of the server

   13) !listallserverevents - lists all the active events specific to a server

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Planned QOL change(s) for the next revision of iNKy:

   1) Allowing users to choose how often and when they wish to be reminded/notified of the event
