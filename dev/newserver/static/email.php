<?php
require '/static/PHPMailer-master/PHPMailerAutoload.php';

// the message
//$data = json_decode($_POST["data"]);
//$name = $data->{'name'};
//$email = $data->{'email'};
//$toField_name = $data->{'toFIeld_name'};
//$toField = $data->{'toFIeld'};
//$link = $data->{'link'};

$name = $_POST["name"];
$email = $_POST["email"];
$toField_name = $_POST["toFIeld_name"];
$toField = $_POST["toFIeld"];
$link = $_POST["link"];

$msg = "<p>Hi " . "$toField_name" . "!</p><p>I would like to invite you to see a combined network of our email contacts. If you agree, please click <a href=" . "$link" . ">here</a> to see the network.</p><p>Best,</br>" . "$name" . "</p>";
//$msg = wordwrap($msg,70);
//print $email;
$mail = new PHPMailer;


//$mail->isSMTP();                                      // Set mailer to use SMTP
//$mail->Host = 'smtp.gmail.com';  // Specify main and backup SMTP servers
//$mail->SMTPAuth = true;                               // Enable SMTP authentication
//$mail->Username = 'junezjx@gmail.com';                 // SMTP username
//$mail->Password = 'zjx19920624008';                           // SMTP password
//$mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
//$mail->Port = 465;    // TCP port to connect to
//$a = "http://web.engr.illinois.edu/~jzhng144/598/reminder.html?";
//$b = $a . $user;
//print $b;
// send email
//$state = mail($email,"Reminder from GroupDiscussion",$msg);
//$body = file_get_contents($b);
//$body = eregi_replace("[\]",'',$body);
$mail->isHTML(true);
$mail->Body = $msg;
$a = "../reminder.html";
//$mail->msgHTML(file_get_contents($a));
//$mail->msgHTML($msg);
$mail->setFrom($email, $name);
$mail->Subject = "Invitation to see a combined email network";//$msg;
//$mail->MsgHTML($body);
$address = $toField;
$mail->addAddress($address, $toField_name);
if(!$mail->send()) {
    echo 'Message could not be sent.';
    echo 'Mailer Error: ' . $mail->ErrorInfo;
} else {
    echo 'Message has been sent';
}
?>