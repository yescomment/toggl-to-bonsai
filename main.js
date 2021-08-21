const parse = require('csv-parse')
const fs = require('fs')
const { finished } = require('stream/promises')
const { timeStrToDecimal } = require('pretty-time-decimal')

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
      rows.push(row)
    }

    return rows
}

processFile().then(console.log)
