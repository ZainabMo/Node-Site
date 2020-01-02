const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const fs = require('fs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs')

var download = function(url, filename, callback){
	request.head(url, function(err, res, body){
		request(url).pipe(fs.createWriteStream(filename)).on('close', callback)
	})
}

app.get('/', function(req, res) {
	res.render('index', {financialDataArr: [], error: null})
})

app.post('/', function(req, res) {
	let userId = req.body.userId
	let url = 'http://localhost:9090/financial-data/'
	let url2 = 'http://localhost:8080/user-setting/'
	if(userId){
		url = 'http://localhost:9090/financial-data/?userId='+userId
		url2 = 'http://localhost:8080/user-setting/?userId='+userId
	}
	request(url, function (err, response, body) {
		if(err){
	      res.render('index', {financialDataArr: null, error: 'Error2, please try again'})
		}
		else {
			let allText = JSON.parse(body)
			let formattedInfo = [] //use formattedInfo.push(something)
			request(url2, function (err, response, body){
				if(userId){
					let settingInfo = JSON.parse(body)
					let decimal = settingInfo[0].decimal //how many zeroes
					let scale = settingInfo[0].scale //3 means thousan. if 0, do nothing. divide by 10^scale
					formattedInfo.push(allText[0])
					let letter = ''
					if (scale == 3) {letter = 'K'}
					else if (scale == 6) {letter = 'M'}
					else if (scale == 9) {letter = 'B'}

					formattedInfo[0].totalAssets = 1.0*(formattedInfo[0].totalAssets)/(1.0*((Math.pow(10, scale))))
					formattedInfo[0].netLoans = 1.0*(formattedInfo[0].netLoans)/(1.0*((Math.pow(10, scale))))
					formattedInfo[0].grossLoans = 1.0*(formattedInfo[0].grossLoans)/(1.0*((Math.pow(10, scale))))

					formattedInfo[0].totalAssets = (formattedInfo[0].totalAssets.toFixed(decimal)).toString() + letter
					formattedInfo[0].netLoans = (formattedInfo[0].netLoans.toFixed(decimal)).toString() + letter
					formattedInfo[0].grossLoans = (formattedInfo[0].grossLoans.toFixed(decimal)).toString() + letter
					res.render('index', {financialDataArr: formattedInfo, error: null})
				}
				else{ //do it to all
					let settingInfo = JSON.parse(body)
					let uId = ''
					let letter = ''
					let decimal = 0
					let scale = 0
					allText.forEach(x =>  {
						formattedInfo.push(x);
					})
					
					for(let i = 0; i < settingInfo.length; i++){
						uId = settingInfo[i].userId
						decimal = settingInfo[i].decimal
						scale = settingInfo[i].scale
						if (scale == 3) {letter = 'K'}
						else if (scale == 6) {letter = 'M'}
						else if (scale == 9) {letter = 'B'}
						for (let j = 0; j < formattedInfo.length; j++){
							if (formattedInfo[j].userId==uId){
								formattedInfo[j].totalAssets = 1.0*(formattedInfo[j].totalAssets)/(1.0*((Math.pow(10, scale))))
								formattedInfo[j].netLoans = 1.0*(formattedInfo[j].netLoans)/(1.0*((Math.pow(10, scale))))
								formattedInfo[j].grossLoans = 1.0*(formattedInfo[j].grossLoans)/(1.0*((Math.pow(10, scale))))

								formattedInfo[j].totalAssets = (formattedInfo[j].totalAssets.toFixed(decimal)).toString() + letter
								formattedInfo[j].netLoans = (formattedInfo[j].netLoans.toFixed(decimal)).toString() + letter
								formattedInfo[j].grossLoans = (formattedInfo[j].grossLoans.toFixed(decimal)).toString() + letter
							}
						}
					}
					res.render('index', {financialDataArr: formattedInfo, error: null})
				}
			})	
		}
	})
})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})