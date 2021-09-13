const parse = require('csv-parse')
const fs = require('fs')
const { finished } = require('stream/promises')
const { timeStrToDecimal } = require('pretty-time-decimal')
const convertTime = require('convert-time')

const inputFilename = 'togglExportExample.csv'
const outputFilename = 'bonsaihours.csv'
const MAPPINGS = require('./mappings.json')

const processFile = async () => {
  bonsaiRows = []
  const parser = fs
    .createReadStream(`${__dirname}/${inputFilename}`)
    .pipe(parse({
      columns: true
    }))

    for await (const togglRow of parser) {
      const bonsaiRow = {}

      const hoursDecimal = timeStrToDecimal(togglRow['Duration'])
      bonsaiRow['Hours'] = Math.ceil(hoursDecimal * 10) / 10 // round up to nearest 6 mins

      bonsaiRow['Date'] = togglRow['Start date']
      bonsaiRow['Time'] = convertTime(togglRow['Start time'], 'hh:MM A')

      bonsaiRow['Activity'] = togglRow['Description']
      bonsaiRow['Project'] = togglRow['Project']

      const clientName = normalizeClientName(togglRow['Client'])

      bonsaiRow['Client name'] = clientName
      bonsaiRow['Client email'] = clientToEmail(clientName)

      bonsaiRows.push(bonsaiRow)
    }

    return bonsaiRows
}

function normalizeClientName(clientName) {
  if (MAPPINGS.togglClientToBonsaiClient[clientName] !== undefined) {
    return MAPPINGS.togglClientToBonsaiClient[clientName]
  } else {
    return clientName
  }
}

function clientToEmail(clientName) {
  if (MAPPINGS.togglClientToEmail[clientName] !== undefined) {
    return MAPPINGS.togglClientToEmail[clientName]
  } else {
    return ''
  }
}

processFile().then(console.log)
