document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Sending email when submitting form
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Clear previously viewed mailbox
  document.querySelector('#emails-view').innerHTML = '';
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetching emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(email => {

        // Getting info
        const from = email['sender'];
        const subject = email['subject'];
        const timestamp = email['timestamp'];
        const read = email['read'];
        const id = email['id'];
        
        // Creating and styling row and columns
        const row = document.createElement('div');
        row.className = 'row';
        const column_1 = document.createElement('div');
        column_1.className = 'col';
        column_1.style.fontWeight = 'bold';
        const column_2 = document.createElement('div');
        column_2.className = 'col';
        column_2.style.textAlign = 'left';
        const column_3 = document.createElement('div');
        column_3.className = 'col';
        column_3.style.textAlign = 'right';
        column_3.style.fontWeight = 'lighter';
        column_3.style.fontStyle = 'italic';
        row.append(column_1, column_2, column_3);
        row.style.border = '3px solid black';
        row.style.borderRadius = '10px';
        row.style.padding = '20px';
        row.style.marginBottom = '20px';
        if (read === true) {
          row.style.backgroundColor = '#CDCDCD';
        }
        row.addEventListener('click', () => view_email(id, mailbox));

        // Adding information to columns
        column_1.innerHTML = from;
        column_2.innerHTML = subject;
        column_3.innerHTML = timestamp;

        // Adding row to page
        document.querySelector('#emails-view').append(row);
      });
  });
}

function send_email(event) {

  // Prevents browser from reloading after sending email
  event.preventDefault();

  // Sending email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
  
  // Loading sent mailbox on a 15ms delay
  setTimeout(function() {
    load_mailbox('sent');
  }, 15);
}

function view_email(id, mailbox) {

  // Clear previously viewed email
  document.querySelector('#email-view').innerHTML = '';

  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Fetch email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // Getting info
      const from = email['sender'];
      const recipients = email['recipients'];
      const subject = email['subject'];
      const timestamp = email['timestamp'];
      const body = email['body'];
      const archived = email['archived'];

      // Placing info
      const heading = document.createElement('h3');
      heading.innerHTML = `Subject: ${subject}`;

      const sender = document.createElement('h4');
      sender.innerHTML = `From: ${from}`;

      const receivers = document.createElement('h4');
      receivers.innerHTML = "To: "
      recipients.forEach(person => {
        receivers.innerHTML += person;
      });

      const time_sent = document.createElement('h5');
      time_sent.innerHTML = `Sent on: ${timestamp}`;

      document.querySelector('#email-view').append(heading, sender, receivers, time_sent);
      
      // Setting up archived/unarchived and reply buttons if not opened in 'sent' mailbox
      if (mailbox !== 'sent') {
        const archive = document.createElement('input');
        archive.type = 'button';
        archive.className = 'btn btn-sm btn-outline-primary';
        if (archived === true) {
          archive.value = 'Unarchive';
          archive.onclick = function() {
            archive_email(id, false);
          }
        }
        else {
          archive.value = 'Archive';
          archive.onclick = function() {
            archive_email(id, true);
          }
        }
        document.querySelector('#email-view').append(archive);

        const reply = document.createElement('input');
        reply.type = 'button';
        reply.className = 'btn btn-sm btn-outline-primary';
        reply.value = 'Reply';
        reply.onclick = function() {
          reply_email(id);
        }
        document.querySelector('#email-view').append(reply);
      }

      const content = document.createElement('div');
      content.innerHTML = body;
      content.style.marginTop = '20px';
      content.style.borderTop = '2px solid #CDCDCD';
      content.style.whiteSpace = 'pre-wrap';
      document.querySelector('#email-view').append(content);
  });

  // Marking email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function archive_email(id, boolean) {

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: boolean
    })
  })

  // Loading inbox mailbox on a 15ms delay
  setTimeout(function() {
    load_mailbox('inbox');
  }, 15);
}

function reply_email(id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // Filling out sender
      document.querySelector('#compose-recipients').value = email['sender'];

      // Filling out subject
      if (!email['subject'].includes('Re: ')) {
        document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
      }
      else {
        document.querySelector('#compose-subject').value = email['subject'];
      }

      // Filling out body
      document.querySelector('#compose-body').value = `\nOn ${email['timestamp']} ${email['sender']} wrote:\n${email['body']}`;
  });
}