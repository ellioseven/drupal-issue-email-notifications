const mailgun = require("mailgun-js")

exports.send = (apiKey, domain, from, to, subject, html) => {
  const client = mailgun({ apiKey, domain })
  const data = { from, to, subject, html }
  client.messages().send(data, (error, body) => {
    if (error) console.log(error)
    if (body.message) console.log(body.message)
  })
}

