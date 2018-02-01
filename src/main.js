// Set default configuration
// Merge user configuration
// Request issues
// Build payload
// Send request to TEP

// @todo Parse templates for subject.
// @todo Camelcase configuration keys.

const axios = require("axios")
const mailgun = require("./mailgun.js")

const main = () => {
  const secrets = require("./.secrets")
  const options = require("./config")

  const defaults = {
    tep: "mailgun",
    subject: "Drupal Issue: {{ title }} - {{ issue_tags }}",
    criteria_type: "created",
    criteria_limit: 10,
    project: 3060
  }

  // Merge user and defualt configuration.
  const config = parseConfig({...defaults, ...options})
 
  // Build API payload.
  const url = "https://www.drupal.org/api-d7/node.json"
  const params = parseApiParams(config)

  // Send request.
  axios.get(url, {params})
    .then(response => {
      const nodes = parseNodes(response, config)
      if ("mailgun" === config.tep) {
        const apiKey = secrets.mailgun_api_key
        const domain = secrets.mailgun_domain
        nodes.forEach(node => {
          mailgun.send(
            apiKey,
            domain,
            config.from,
            config.to,
            config.subject,
            node.body.value
          )
        })
      }
    })
    .catch(error => {
      console.log(error)
    })
}

const parseConfig = config => {
  // Check required configuration.
  const required = [
    "tep",
    "subject",
    "criteria_type",
    "criteria_limit",
    "project",
    "from",
    "to"
  ]
 
  let invalid = required.filter(req => !config[req])
  if (invalid.length) {
    throw new Error(`Missing required configuration: "${invalid}"`)
  }

  return config
}

const parseApiParams = args => {
  let params = {}

  // Only query issue nodes.
  params.type = "project_issue"

  // Sort query by descending (latest first).
  params.direction = "DESC"

  // Parse sort.
  if (args.criteria_type) {
    // @todo Ensure only allow keys.
    params.sort = args.criteria_type
  }

  // Parse issue tags.
  if (args.issue_tag) {
    if (args.issue_tag) {
      params.taxonomy_vocabulary_9 = args.issue_tag
    }
  }

  return params
}

const parseNodes = (response, config) => {
  if (!response.data.list) return
  return response.data.list.filter(node => {
    // Current time in seconds.
    const time = Date.now() / 1000

    // Node created and changed time in seconds.
    const created = Number(node.created)
    const changed = Number(node.changed)

    // Filter node on criteria.
    if (config.criteria_type === "created") {
      const limit = time - (60 * config.criteria_limit)
      if (created > limit) {
        return node
      }
    } else if (config.criteria_type === "changed") {
      const limit = time - (60 * config.criteria_limit)
      if (changed > limit) {
        return node
      }
    }
  })
}

main()
