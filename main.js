const parseCSV = require('csv-parse')
const writeCSV = require('node-create-csv')
const fs = require('fs')
const { timeStrToDecimal } = require('pretty-time-decimal')
const convertTime = require('convert-time')

const inputFile = 'togglExportExample.csv'
const outputFile = `/Users/jacob/Downloads/bonsaihours-${Date.now()}.csv`

const MAPPINGS = require('./mappings.json')

async function processFile() {
  bonsaiRows = []
  const parser = fs
    .createReadStream(`${__dirname}/${inputFile}`)
    .pipe(parseCSV({
      columns: true,
      trim: true
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

      if (togglRow['Tags'].includes('invoiced')) {
        console.log(`Skipping ${togglRow['Client']} entry on ${bonsaiRow['Date']} at ${bonsaiRow['Time']}: tagged as already invoiced`)
      } else if (bonsaiRow['Client name'] === '' || bonsaiRow['Client email'] === '') {
        console.log(`Skipping ${togglRow['Client']} entry on ${bonsaiRow['Date']} at ${bonsaiRow['Time']}: no client info`)
      } else {
        bonsaiRows.push(bonsaiRow)
      }
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

async function writeFile(records) {
  const csv = new writeCSV(records)
  await csv.toDisk(outputFile, {
    showHeader: true
  })
}

processFile()
  .then(records => writeFile(records))
  .then(() => console.log(`Complete.`))
  .catch(console.error)
