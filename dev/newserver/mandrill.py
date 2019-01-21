import os
import db
import smtplib
import string # for tls add this line
from email.utils import formatdate
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import time
import json
import traceback

def sendEmail(me, to, plain, html, subject):
  # Create message container - the correct MIME type is multipart/alternative.
  msg = MIMEMultipart('alternative')
  msg['Subject'] = subject
  msg['From'] = "Immersion <" + me + ">"
  msg['To'] = to

  # Record the MIME types of both parts - text/plain and text/html.
  part1 = MIMEText(plain, 'plain')
  part2 = MIMEText(html, 'html')

  # Attach parts into message container.
  # According to RFC 2046, the last part of a multipart message, in this case
  # the HTML message, is best and preferred.
  msg.attach(part1)
  msg.attach(part2)

  # Send the message via local SMTP server.
  smtp = smtplib.SMTP('smtp.mandrillapp.com', 587)
  # sendmail function takes 3 arguments: sender's address, recipient's address
  # and message to send - here it is sent as one string.
  smtp.ehlo() # for tls add this line
  smtp.starttls() # for tls add this line
  smtp.ehlo() # for tls add this line
  smtp.login(me, 'iRq9BtwgZDbbqtDsVsCT1A')
  smtp.sendmail(me, to, msg.as_string())
  smtp.quit()


def sendEmailDone(me, to):
  plain = "Thank you for visiting Immersion. Your experience is ready at https://hobbit.media.mit.edu "
  html = """\
    <html>
      <head></head>
      <body>
        <p>
          Thank you for visiting Immersion!<br/>
          Your experience is ready at <a href=\"https://hobbit.media.mit.edu/viz\">hobbit.media.mit.edu</a>.
        </p>
        <p>
          Cheers!<br/><a href=\"https://hobbit.media.mit.edu\">Immersion</a>  |  <a href=\"http://macro.media.mit.edu\">Macro Connections</a>  |  <a href=\"http://media.mit.edu\">MIT Media Lab</a>
        </p>
      </body>
    </html>
  """
  sendEmail(me, to, plain, html, "Your Immersion experience is ready!")

def sendEmailImap(me, to):
  plain = "Thank you for visiting Immersion. Please enable IMAP. Instructions for enabling IMAP are available at https://hobbitn.media.mit.edu/imap"
  html = """\
    <html>
      <head></head>
      <body>
        <p>
          Thank you for visiting Immersion!<br/>
          We tried to collect your data, but it seems like IMAP is not enabled for your 'All Mail' folder. <br/>
          Instructions for enabling IMAP are available <a href=\"https://hobbit.media.mit.edu/imap\">here</a>.
        </p>
        <p>
          Cheers!<br/><a href=\"https://hobbit.media.mit.edu\">Immersion</a>  |  <a href=\"http://macro.media.mit.edu\">Macro Connections</a>  |  <a href=\"http://media.mit.edu\">MIT Media Lab</a>
        </p>
      </body>
    </html>
  """
  sendEmail(me, to, plain, html, "Enabling IMAP")

while True:
  task = db.popNotify()
  if task is None:
    time.sleep(3)
    continue
  try:
    email = task['email']
    me = "jingxian@media.mit.edu"
    if 'imap' in task:
      sendEmailImap(me, email)
      db.log(email=email, ip=None, module="notifier", msg="sent imap email from " + me)
  except:
    # add the email task again to the queue
    if 'imap' in task: db.pushNotifyImap(email)
    db.log(email=email, ip=None, module="notifier", msg=traceback.format_exc(), level=logging.ERROR)


