const express = require('express')
const line = require('@line/bot-sdk')
const axios = require('axios')
const visionURL = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCOLw7yAvDHhXa1_FdoFD6QzXEooESleo8'

const config = {
  channelAccessToken: 'WAgWU3yf4myaUKsaLJvXnuGto7aBddB/1Z7fyj/TldoW+xQ70IMQKfSDP4ZGixxQ9Gj5EqkE2H0eChez0tQuEeWpADZIqboKJkbs9vHO6P1VNJvU3MPjLcsnIfZaH2sa0x63lElLWfjSvFv7mygjGAdB04t89/1O/w1cDnyilFU=',
  channelSecret: '8ea12854ee6a5bf39491e0f8ec1673ab'
}

const client = new line.Client(config)

const app = express()

app.get('/', (req, res) => {
    res.send({
      msg: 'hello from home page'
    })
})

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
})

const keywords = {
  printing: [
    'ปริ้น',
    'ปริน',
    'ปิ้น',
    'print'
  ],
  greeting: [
    'สวัสดี',
    'หวัดดี',
    'ดีจ้า',
    'hello',
    'hi'
  ],
  checkin: [
    'checkin',
    'check in',
    'Check in',
    'check-in',
    'Check-in'
  ]
}

const stages = []

const match = (text, keywords) => {
  return keywords.some(keyword => text.includes(keyword))
}

async function handleEvent(event) {
  if (event.type !== 'message') { //|| event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  console.log(event)

  const user = stages.find(userx => userx.userId === event.source.userId) || {}

  // Printing
  if (user.stage === 'printing') {
    if (event.message.type !== 'image') {
      user.stage = undefined
    } else {
      const stream = await client.getMessageContent(event.message.id)
      const buffer =  await new Promise((resolve, reject) => {
        let bufs = []
        stream.on('data', (chunk) => { bufs.push(chunk) })
        stream.on('error', (err) => { reject(err) })
        stream.on('end', () => {
          resolve(Buffer.concat(bufs))
        })
      })
      const { data } = await axios.post(visionURL, {
        "requests":[
          {
            "image":{
              "content": buffer.toString('base64')
            },
            "features":[
              {
                "type":"LABEL_DETECTION",
                "maxResults":6
              }
            ]
          }
        ]
      })
      console.log(data.responses[0].labelAnnotations.map(item => item.description))

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `ได้รับรูป ${data.responses[0].labelAnnotations[0].description} แล้ว`
        }
      ])
    }
  }

  if (user.stage === 'checkin') {
    if (event.message.type !== 'image') {
      user.stage = undefined
    } else {
      const stream = await client.getMessageContent(event.message.id)
      const buffer =  await new Promise((resolve, reject) => {
        let bufs = []
        stream.on('data', (chunk) => { bufs.push(chunk) })
        stream.on('error', (err) => { reject(err) })
        stream.on('end', () => {
          resolve(Buffer.concat(bufs))
        })
      })
      const { data } = await axios.post(visionURL, {
        "requests":[
          {
            "image":{
              "content": buffer.toString('base64')
            },
            "features":[
              {
                "type":"FACE_DETECTION",
                "maxResults":6
              }
            ]
          }
        ]
      })
      const joy = data.responses[0].faceAnnotations[0].joyLikelihood
      if (joy === 'VERY_LIKELY' || joy === 'LIKELY') {
        user.stage = undefined
        return client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: `Check-in เรียบร้อย! ขอให้มีความสุขกับการทำงานครับ!`
          }
        ])
      } else {
        return client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: `ยิ้มกว้างๆกว่านี้หน่อยน่าาาาา`
          }
        ])
      }
    }
  }

  console.log(user)

  // No stages yet
  if (!user.stage) {
    // printing
    if (match(event.message.text, keywords.printing)) {
      stages.push({
        userId: event.source.userId,
        stage: 'printing'
      })
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: 'ฝากปริ้นท์หรอ? ส่งรูปมาได้เลย!'
        }
      ])
    }
    // greeting
    if (match(event.message.text, keywords.greeting)) {
      const { displayName } = await client.getProfile(event.source.userId)
      return client.replyMessage(event.replyToken, [
        {
          "type": "image",
          "originalContentUrl": "https://image.winudf.com/v2/image/Y29tLmdvb2QueG94bzYzX3NjcmVlbnNob3RzXzFfN2FjNzkyYmU/screen-1.jpg?h=355&fakeurl=1&type=.jpg",
          "previewImageUrl": "https://image.winudf.com/v2/image/Y29tLmdvb2QueG94bzYzX3NjcmVlbnNob3RzXzFfN2FjNzkyYmU/screen-1.jpg?h=355&fakeurl=1&type=.jpg"
        },
        {
          type: 'text',
          text: `สวัสดีตอนเช้าครับคุณ ${displayName.trim()} ทุกเช้าเราชาร์จจจจจจจ🔥🔥🔥`
        }
      ])
    }

    // checkin
    if (match(event.message.text, keywords.checkin)) {
      stages.push({
        userId: event.source.userId,
        stage: 'checkin'
      })
      const { displayName } = await client.getProfile(event.source.userId)
      return client.replyMessage(event.replyToken, [
        {
          "type": "image",
          "originalContentUrl": "https://image.winudf.com/v2/image/Y29tLmdvb2QueG94bzYzX3NjcmVlbnNob3RzXzFfN2FjNzkyYmU/screen-1.jpg?h=355&fakeurl=1&type=.jpg",
          "previewImageUrl": "https://image.winudf.com/v2/image/Y29tLmdvb2QueG94bzYzX3NjcmVlbnNob3RzXzFfN2FjNzkyYmU/screen-1.jpg?h=355&fakeurl=1&type=.jpg"
        },
        {
          type: 'text',
          text: `สวัสดีตอนเช้าครับ ยืนยันความพร้อมในการทำการด้วยการ ยิ้ม😄 !`
        }
      ])
    }
  }

  return client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: 'คืออะไรหรอครับ? ผมไม่เข้าใจ'
    }
  ])

  return client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: event.message.text
    }
  ])
}

app.listen(8000)
