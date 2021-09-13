const parse = require('csv-parse')
const fs = require('fs')
const { finished } = require('stream/promises')
const { timeStrToDecimal } = require('pretty-time-decimal')
const convertTime = require('convert-time')

const inputFilename = 'togglExportExample.csv'
const outputFilename = 'bonsaihours.csv'
const MAPPINGS = require('./mappings.json')

const processFile = async () => {
  rows = []
  const parser = fs
    .createReadStream(`${__dirname}/${inputFilename}`)
    .pipe(parse({
      columns: true
    }))

    for await (const row of parser) {
      row['Hours'] = timeStrToDecimal(row['Duration'])
      row['Hours'] = Math.ceil(row['Hours'] * 10) / 10 // round up to nearest 6 mins

      row['Date'] = row['Start date']
      row['Time'] = convertTime(row['Start time'], 'hh:MM A')

      const clientName = normalizeClientName(row['Client'])

      row['Client name'] = clientName
      row['Client email'] = clientToEmail(clientName)

      rows.push(row)
    }

    return rows
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
