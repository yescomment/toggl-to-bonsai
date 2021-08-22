const parse = require('csv-parse')
const fs = require('fs')
const { finished } = require('stream/promises')
const { timeStrToDecimal } = require('pretty-time-decimal')
const convertTime = require('convert-time')

const inputFilename = 'togglExportExample.csv'
const outputFilename = 'bonsaihours.csv'

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

      rows.push(row)
    }

    return rows
}

processFile().then(console.log)
