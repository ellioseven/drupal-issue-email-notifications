// @todo Editable message html.
// @todo Camelcase configuration keys.
// @todo Filter irrelevant issue tags from subject and message?

const axios = require("axios")
const fs = require("fs")
const mailgun = require("./mailgun.js")
const mustache = require("mustache")

// Entry point.
const main = () => {
  const secrets = require("./.secrets")
  const options = require("./config")

  // Merge user and defualt configuration.
  const config = parseConfig(options, secrets)

  // Build API payload.
  const url = "https://www.drupal.org/api-d7/node.json"
  const params = parseApiParams(config)

  // Send request.
  axios.get(url, {params})
    .then(response => {
      const nodes = parseNodes(response, config)

      // Invoke Mailgun response handler.
      if (config.tep === "mailgun") {
        sendMailgun(nodes, config, secrets)
      }
    })
    .catch(error => {
      console.log(error)
    })
}

// Build configuration object.
const parseConfig = (options, secrets) => {
  // Required configuration keys.
  const required = [
    "tep",
    "subject",
    "criteria_type",
    "criteria_limit",
    "project",
    "from",
    "to"
  ]

  // Default configuration object.
  const defaults = {
    tep: "mailgun",
    subject: "Drupal Issue - Project: {{ project }} - Title: {{ title }} - Issue Tags: {{ issue_tags }}",
    criteria_type: "created",
    criteria_limit: 10,
    project: 3060
  }

  // Merge user and defualt configuration.
  const config = {...defaults, ...options}

  // Check required configuration.
  let invalid = required.filter(req => !config[req])
  if (invalid.length) {
    throw new Error(`Missing required configuration: "${invalid}"`)
  }

  // Check Mailgun configuration.
  if (config.tep === "mailgun") {
    if (!secrets.mailgun_api_key) throw Error("Mailgun API key is required")
    if (!secrets.mailgun_domain) throw Error("Mailgun domain is required")
  }

  return config
}

// Build API query object.
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

  // Parse project.
  if (args.project) {
    params.field_project = args.project
  }

  // Parse issue tags.
  if (args.issue_tag) {
    if (args.issue_tag) {
      // d.org uses "taxonomy_vocabulary_9" field to store issue tag terms.
      params.taxonomy_vocabulary_9 = args.issue_tag
    }
  }

  return params
}

// Filter node query against criteria.
// @todo Store and cache human friendly names for issue tags and projects.
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

// Build comma separated list of issue tags.
const parseIssueTags = node => {
  return node.taxonomy_vocabulary_9
    .reduce((previous, term) => {
      previous.push(term.id)
      return previous
    }, [])
    .join(", ")
}

// Build TEP subject line.
const parseSubject = (node, config) => {
  let subject = config.subject
  
  const { title, field_project: { id: project } } = node
  const issue_tags = parseIssueTags(node)

  return mustache.render(subject, { title, project, issue_tags })
}

// Build TEP HTML.
const parseHtml = (node, config) => {
  const {
    title,
    url,
    body: { value: body },
    field_project: { id: project }
  } = node

  const issue_tags = parseIssueTags(node)

  // Load message template.
  const template = fs.readFileSync("message.html", "utf-8")

  // Return parsed template.
  return mustache.render(template, { title, url, body, project, issue_tags })
}

// Mailgun TEP request hander.
const sendMailgun = (nodes, config, secrets) => {
  const apiKey = secrets.mailgun_api_key
  const domain = secrets.mailgun_domain

  // Send request via Malgun API.
  nodes.forEach(node => {
    mailgun.send(
      apiKey,
      domain,
      config.from,
      config.to,
      parseSubject(node, config),
      parseHtml(node, config)
    )
  })
}

main()

