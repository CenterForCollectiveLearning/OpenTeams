# OpenTeams

OpenTeams is an open source suite for visualizing team data. You can try a demo version of openteams at openteam.info. 

OpenTeams was developed by Jingxian Zhang as part of her Master thesis at the Collective Learning group at the MIT Media Lab, under the supervision of Professor Cesar Hidalgo. OpenTeams builds on the workd done in Immersion, a project to visualize individual email metadata created at the MIT Media Lab by Daniel Smilkov and Deepak Jagdish under the direction of Professor Cesar Hidalgo. Xiaojiao Chen and Diana Orghian also contributed to OpenTeams by helping, respectively, with graphic design and social psychology expertise.

<img src="https://openteam.info/static/images/intro1.2.png" width="70%" align="middle">

You can use this repository to install your own private version of open teams in a local server. 

Run ./teams-startup.sh to start the project.


Authentication data in the project have been replaced with xxxxxx. They are:

1. client_id and client_secret in dev/newserver/client_secrets.json
2. client_id and client_secret in dev/newserver/client_secrets_outlook.json
3. client_id and client_secret in dev/newserver/client_secrets_slack.json
4. client_id in authurl in dev/newserver/templates/index_old.html
5. client_id in authurl in dev/newserver/templates/indexJoin.html
6. client_id in authurl in dev/newserver/templates/indexStudy.html
7. client_id in authurl in dev/newserver/templates/teamJoin.html
8. client_id in authurl in dev/newserver/templates/teamLogin_single.html
9. client_id in authurl in dev/newserver/templates/teamLogin.html
10. client_id in authurl in dev/newserver/templates/v2teamJoin.html
11. client_id in authurl in dev/newserver/templates/dotest.html
12. client_id in authurl in dev/newserver/templates/gmail/busy.html

——————-———————————————- Core stack ————-———-————-—————————

Server-side Programing
- Operating System: Ubuntu 16.04
- Language: Python 2.7
- Application Framework: Tornado
- Web Server: Nginx
- Database: MongoDB


Client-side Programing
- Javascript , HTML5, and CSS3
- D3.js, jQuery


Communication
- API
  - Tornado RESTful API
  - Data Format: JSON

——————————-—————-— Security/User Administration ———-———————————-—

Server-side
- Security Protocol for the server: SSL
- Admin accessing the server
  - SSH (remote login) and RSYNC (file transfer)


Client-side
- Email login authorization 
  - Gmail: OAuth 2.0 protocol in Google API
  - Outlook: OAuth 2.0 protocol in Outlook REST API
- Rooms can only be joined with the password set by the admin of the room (the person who created the room). Amin should share the password securely to the other members he/she invites to the room.

———————-—————-———————-— Logging ————————-—-——————————-—

User activities are logged in the MongoDB document logging.


—————————-—-——————-— External Data Sources ——————-——————————-—
- Big Five Personality Survey: https://www.outofservice.com/bigfive/info/ 
- Moral Foundations Survey: http://www.yourpersonality.net/political/griffin1.pl 
