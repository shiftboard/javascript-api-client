#!/usr/local/bin/node

const https = require('https')
const jsSHA = require('jssha')

var accessKeyID = '01234567-89ab-cdef-0123-456789abcdef'
var secretKey   = 'this-is-just-a-test-replace-with-your-keys'

accountList()
async function accountList () {

    // https://www.shiftdata.com/#account-list
    var params = {
        select: {
        },
        page: {
            batch: 120,
            start: 1,
        }
    }

    var accountListResult = await shiftboardAPI('account.list', params )

    if ( accountListResult.result.page.next ) {
        params.page = accountListResult.result.page.next
        var accountListResult2 = await shiftboardAPI('account.list', params )
        console.log(JSON.stringify(accountListResult2))
    }
    else {
        console.log(JSON.stringify(accountListResult))
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
async function shiftboardAPI (api_method, obj) {
    var options = {
      host: 'api.shiftdata.com',
      path: '/servola/api/api.cgi',
      method: 'POST',
    }
    var post_data
    var params = JSON.stringify(obj)

    var path = '?access_key_id=' + encodeURIComponent(accessKeyID)

    var shaObj = new jsSHA('SHA-1', 'TEXT')
    shaObj.setHMACKey(secretKey, 'TEXT')

    if (options.method == 'POST') {
        post_data = JSON.stringify({ 'id': 1, 'jsonrpc': '2.0', 'method': api_method, 'params': JSON.parse(params) })
        shaObj.update(post_data)
        options.headers = { 'Content-Type': 'application/json', 'Content-Length': post_data.length }
    }
    else if (options.method == 'GET') {
        path += '&jsonrpc=2.0&id=1&method=' + encodeURIComponent(api_method) + '&params=' + encodeURIComponent(btoa(params))
        shaObj.update('method' + api_method + 'params' + params)
    }

    var hmac = shaObj.getHMAC('B64')
    path += '&signature=' + encodeURIComponent(hmac)

    options.path += path

    let p = new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
          //console.log(options)
          let responseBody = '';
          res.on('data', (chunk) => {
              responseBody += chunk
          })

          res.on('end', () => {
            resolve(JSON.parse(responseBody))
          })
      })

      req.on('error', reject)

      if (options.method == 'POST') {
          //console.log(JSON.parse(post_data))
          req.write(post_data)
      }
      req.end()
    })

    return p
}


function btoa(str) {
    var buffer;

    if (str instanceof Buffer) {
        buffer = str;
    } else {
        buffer = Buffer.from(str.toString(), 'binary');
    }

    return buffer.toString('base64');
}
