# Drupal Issue Email Notifications

[drupal.org](https://drupal.org) provides email notifications for project
issues. Current functionality is rather primitive.

This project aims to extend email notification capability with a configurable
issue query (eg: filter by issue tag) sent to [drupal.org](https://drupal.org).
For each selected issue, a configurable request is sent to a transactional
email provider.

**Note:** Default configuration may cause a lot of email traffic. Specifing
`issue_tag` and `project` configuration is strongly recommended.

**Note:** This project should be coupled with a cronjob to automate interval
processing agsint multiple projects.

**Note:** Incoming email provider may offer an automated tagging system. Use
that combined with the projects configurable options to your advantage.

## tl;dr

**`@todo`** - Add a tl;dr.

## Terms

- **TEP** - Transactional email provider

## Supported TEPs

Currently, only [Mailgun](https://www.mailgun.com) is supported. They have a
nice free plan.

## Secrets

Sensitive information should be stored in `.secrets.json` and ignored from VCS.
See `.secrets.example.json`.

### `mailgun_api_key`

- **Required:** True
- **Type:** String

Generated Mailgun API key for authorisation.

**`@todo`** - How do I get my mailgun API key?

### `mailgun_domain`

- **Required:** True
- **Type:** String

Generated Mailgun domain.

**`@todo`** - How do I get my mailgun domain?

## Configuration

All configuration is stored in `config.json`. See `config.example.json`.

### `tep`

- **Default:** `mailgun`
- **Type:** String

Transactional email provider, currently only supports `mailgun`.

### `from`

- **Required:** Yes
- **Type:** String

'from' email address sent to TEP.

### `to`

- **Required:** Yes
- **Type:** String

'to' email address sent to TEP.

### `subject`

- **Required**: Yes
- **Template**: Yes
- **Type:** String

Email subject line sent to TEP.

#### Template variables:

- `{{ title }}` - Title of the issue
- `{{ issue_tags }}` - Comma separated list of issue tag labels

### `criteria_type`

- **Default:** `created`
- **Type:** String

Select issues by either `created` or `updated`, sorted from latest to oldest.

### `criteria_limit`

- **Default:** `10`
- **Type:** Integer

Limit for `criteria_type`. By default, issues created within the first 10
minutes of the initial request will be selected, unless either `criteria_limit`
or `criteria_type` is changed.

### `issue_tag`

- **Default:** `*`
- **Type:** Integer

Issue tag taxonomy term ID. Determines which issue tag should be used for
selection, eg: `772` (Novice). By default, no issue tag is applied for issue
selection.

**`todo`** - How do I find an issue tag ID?

### `project`

- **Default:** `*`
- **Type:** Integer

Which project should be used to issue selection. By default, `3060` (core)
will be used.

**`todo`** - How do I find a project ID?

## Usage

**`todo`** - Add usage instructions.
**`todo`** - Crontab instructions.

## Roadmap

- Examples
- Issue status integration

