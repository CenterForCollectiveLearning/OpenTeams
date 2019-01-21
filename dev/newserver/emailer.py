import logging
import logging.handlers
import smtplib
import string # for tls add this line
from email.utils import formatdate
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import random

def sendEmailWithNetwork(emails, filename, group_id, host, senderdata):
  # me == my email address
  # you == recipient's email address
  # idx = random.randint(1, 9)
  # me = "em" + str(idx) + "@hobbit.media.mit.edu"
  me = "junezjx@gmail.com"
  you = ""
  full_you = ""
  for email in emails:
    full_you += email
    if emails.index(email) != len(emails) - 1:
        full_you += ","
  #
  # # Create message container - the correct MIME type is multipart/alternative.
  # msg = MIMEMultipart('alternative')
  # msg['Subject'] = "Invitation to see a combined email network"
  # msg['From'] = "Immersion Team<" + me + ">"
  # msg['To'] = you
  #
  # # Create the body of the message (a plain-text and an HTML version).
  # text = "Hi there!\nI would like to invite you to see a combined network of our email contacts. If you agree, please click here to see the network."
  # html = """\
  #   <html>
  #     <head></head>
  #     <body>
  #       <p>Hi there!<br/>
  #         I would like to invite you to see a combined network of our email contacts. If you agree, please click <a href=\"http://hobbit.media.mit.edu:8001/to_join/id=""" + group_id + """\">here</a> to see the network.
  #       </p>
  #       <p>
  #         Cheers!<br/>Immersion Team  |  <a href=\"http://macro.media.mit.edu\">Macro Connections</a>  |  <a href=\"http://media.mit.edu\">MIT Media Lab</a>
  #       </p>
  #     </body>
  #   </html>
  # """

  for email in emails:
      you = email

      # Create message container - the correct MIME type is multipart/alternative.
      msg = MIMEMultipart('alternative')
      msg['Subject'] = "Invitation to see a combined email network"
      msg['From'] = "Immersion Teams<" + me + ">"
      msg['To'] = you

      # Create the body of the message (a plain-text and an HTML version).
      text = "Hi there!\n" + senderdata['name'] + " would like to invite you to see a combined email network with " + full_you + " in Immersion Teams. If you agree to join, please click here to see the network."
      html = """\
        <html>
          <head></head>
          <body>
            <p>Hi there!<br/>
              """ + senderdata['name'] + """ would like to invite you to see a combined email network with """ + full_you + """ in Immersion Teams. If you agree to join, please click <a href=\"http://hobbit.media.mit.edu:8001/to_join/id=""" + group_id + """&ind=""" + str(emails.index(email)) + """\">here</a> to see the network.
            </p>
            <p>
              Cheers!<br/>Immersion Teams  |  <a href=\"http://macroconnections.media.mit.edu\">Collective Learning</a>  |  <a href=\"http://media.mit.edu\">MIT Media Lab</a>
            </p>
          </body>
        </html>
      """


      # Record the MIME types of both parts - text/plain and text/html.
      part1 = MIMEText(text, 'plain')
      part2 = MIMEText(html, 'html')

      # Attach parts into message container.
      # According to RFC 2046, the last part of a multipart message, in this case
      # the HTML message, is best and preferred.
      msg.attach(part1)
      msg.attach(part2)

      # Send the message via local SMTP server.
      smtp = smtplib.SMTP('smtp.gmail.com', 587)
      # sendmail function takes 3 arguments: sender's address, recipient's address
      # and message to send - here it is sent as one string.
      smtp.ehlo() # for tls add this line
      smtp.starttls() # for tls add this line
      smtp.ehlo() # for tls add this line
      smtp.login(me, 'zjx19920624008')
      # smtp.sendmail(me, you, msg.as_string())
      smtp.sendmail(me, [you], msg.as_string())
      smtp.quit()

  # you = me
  you = senderdata['email']
  # Create message container - the correct MIME type is multipart/alternative.
  msg = MIMEMultipart('alternative')
  msg['Subject'] = "Invitation to see a combined email network"
  msg['From'] = "Immersion Teams<" + me + ">"
  msg['To'] = you

  # Create the body of the message (a plain-text and an HTML version).
  text = "Hi there!\n You just invited " + full_you + " to see a combined email network in Immersion Teams. Click here to see the network."
  html = """\
    <html>
      <head></head>
      <body>
        <p>Hi there!<br/>
          You just invited  """ + full_you + """ to see a combined email network in Immersion Teams. Click <a href=\"http://hobbit.media.mit.edu:8001/to_join/id=""" + group_id + """&ind=""" + str(len(emails)) + """\">here</a> to see the network.
        </p>
        <p>
          Cheers!<br/>Immersion Teams  |  <a href=\"http://macroconnections.media.mit.edu\">Macro Connections</a>  |  <a href=\"http://media.mit.edu\">MIT Media Lab</a>
        </p>
      </body>
    </html>
  """


  # Record the MIME types of both parts - text/plain and text/html.
  part1 = MIMEText(text, 'plain')
  part2 = MIMEText(html, 'html')

  # Attach parts into message container.
  # According to RFC 2046, the last part of a multipart message, in this case
  # the HTML message, is best and preferred.
  msg.attach(part1)
  msg.attach(part2)

  # Send the message via local SMTP server.
  smtp = smtplib.SMTP('smtp.gmail.com', 587)
  # sendmail function takes 3 arguments: sender's address, recipient's address
  # and message to send - here it is sent as one string.
  smtp.ehlo() # for tls add this line
  smtp.starttls() # for tls add this line
  smtp.ehlo() # for tls add this line
  smtp.login(me, 'zjx19920624008')
  # smtp.sendmail(me, you, msg.as_string())
  smtp.sendmail(me, [you], msg.as_string())
  smtp.quit()

class TlsSMTPHandler(logging.handlers.SMTPHandler):

  def emit(self, record):
    """
    Emit a record.

    Format the record and send it to the specified addressees.
    """
    try:
        port = self.mailport
        if not port: port = smtplib.SMTP_PORT
        smtp = smtplib.SMTP(self.mailhost, port)
        msg = self.format(record)
        msg = "From: %s\r\nTo: %s\r\nSubject: %s\r\nDate: %s\r\n\r\n%s" % (
                        self.fromaddr,
                        string.join(self.toaddrs, ","),
                        self.getSubject(record),
                        formatdate(), msg)
        if self.username:
            smtp.ehlo() # for tls add this line
            smtp.starttls() # for tls add this line
            smtp.ehlo() # for tls add this line
            smtp.login(self.username, self.password)
        smtp.sendmail(self.fromaddr, self.toaddrs, msg)
        smtp.quit()
    except (KeyboardInterrupt, SystemExit):
        raise
    except:
        self.handleError(record)
