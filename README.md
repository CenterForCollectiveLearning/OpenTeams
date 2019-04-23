# openteams

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

——————-————————— Core stack ————-———-————-———
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

——————————-— Security/User Administration ———-———————
Server-side
- Security Protocol for the server: SSL
- Admin accessing the server
  - SSH (remote login) and RSYNC (file transfer)

Client-side
- Email login authorization 
  - Gmail: OAuth 2.0 protocol in Google API
  - Outlook: OAuth 2.0 protocol in Outlook REST API
- Rooms can only be joined with the password set by the admin of the room (the person who created the room). Amin should share the password securely to the other members he/she invites to the room.

———————-—————-——— Logging ————————-—-——————
User activities are logged in the MongoDB document logging.

—————————-—-—— External Data Sources ——————-——————
- Big Five Personality Survey: https://www.outofservice.com/bigfive/info/ 
- Moral Foundations Survey: http://www.yourpersonality.net/political/griffin1.pl 