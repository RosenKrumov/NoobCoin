import bs4
import requests
import json

def updateHtml():

	response = requests.get(url="http://localhost:3001/blocks")

	with open("../html/index.html") as inf:
		txt = inf.read()
		soup = bs4.BeautifulSoup(txt, 'html.parser')
		
	for i in range(len(json.loads(response.text))):
		blockName = "Block #" + str(json.loads(response.text)[i]['index'])
		if not (blockName in open('../html/index.html').read()):
			blockStr = """<li class="list-group-item">
							<h5>Block #{blockNum}</h5>
							<p>
							Date: {date}  <br>
							Hash: {blockHash}  <br>
							{txns} txns <br>
							Reward: 50 NC
							</p>
						</li> """
			d = dict()
			d['blockNum']=str(json.loads(response.text)[i]['index'])
			d['date']=str(json.loads(response.text)[i]['dateCreated'])
			d['blockHash']=str(json.loads(response.text)[i]['blockHash'])
			d['txns']=str(len(json.loads(response.text)[i]['transactions']))
			
			blockStr = blockStr.format(**d)
			
			soup.select("ul#blocks")[0].append(bs4.BeautifulSoup(blockStr, 'html.parser'))
		
		latestBlockIndex = len(json.loads(response.text)) - 1
		for j in range(len(json.loads(response.text)[latestBlockIndex]['transactions'])):
			txName = "Transaction #" + str(json.loads(response.text)[latestBlockIndex]['transactions'][j]['transactionHash'])
			if not (txName in open('../html/index.html').read()):
				txStr = """<li class="list-group-item">
						   <h5>
							Transaction #{hash}
						   </h5>
						   <p>
							From:{fromAddr} To:{toAddr}
							<br/>
							Amount: {amount}
						   </p>
						  </li>"""
						  
				txDict = dict()
				txDict['hash'] = json.loads(response.text)[latestBlockIndex]['transactions'][j]['transactionHash']
				txDict['fromAddr'] = json.loads(response.text)[latestBlockIndex]['transactions'][j]['fromAddress']
				txDict['toAddr'] = json.loads(response.text)[latestBlockIndex]['transactions'][j]['toAddress']
				txDict['amount'] = json.loads(response.text)[latestBlockIndex]['transactions'][j]['amount']
				
				txStr = txStr.format(**txDict)
				
				soup.select("ul#transactions")[0].append(bs4.BeautifulSoup(txStr, 'html.parser'))

	html = soup.prettify('utf-8')

	with open("../html/index.html", "wb") as file:
		file.write(html)
		
if __name__ == '__main__':
	while(1):
		updateHtml()