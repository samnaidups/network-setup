var Client = require('fabric-client');
var fs = require('fs');
var path = require('path');

var channel_name = 'firstchannel';
var org1mspid = "Org1MSP";
var org2mspid = "Org2MSP";

var genesis_block = null;
var config =null;
var signatures = [];

var org1peersurl = [{url:"grpcs://localhost:7051",eventurl:"grpcs://localhost:7053"},{url:"grpcs://localhost:8051",eventurl:"grpcs://localhost:8053"}];
var org2peersurl = [{url:"grpcs://localhost:9051",eventurl:"grpcs://localhost:9053"},{url:"grpcs://localhost:10051",eventurl:"grpcs://localhost:10053"}];

var client = new Client();

//get the tls certificate of the orderer organization for tls communication
var caRootsPath = "/network-setup/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
let data = fs.readFileSync(caRootsPath);
let caroots = Buffer.from(data).toString();

var orderer = client.newOrderer(
		"grpcs://localhost:7050",
		{
			'pem': caroots,
			'ssl-target-name-override': 'orderer.example.com'
		}
);

//Admin operations

//list all the channel that the peer is part of
//getallChannels(org1peersurl,org1mspid,'org1')


//creates a channel
//createChannel(channel_name,org1mspid,'org1');

//request for peers to join the specified channel
//joinChannel(org1mspid,'org1',org1peersurl)
//joinChannel(org2mspid,'org2',org2peersurl)


//install the chaincode at specified path on the specified peer node
//installchaincode(org1peersurl,'org1',org1mspid,"github.com/chaincode","mychaincodeid","v0");
//installchaincode(org2peersurl,'org2',org2mspid,"github.com/chaincode","mychaincodeid","v0");

//deploys a chaincode on the peer, on recieving this request peer builds and starts a container for chaincode, on successfull users can invoke or query the chaincode 
//instantiateChaincode(channel_name,org1peersurl,org2peersurl,'org1',org1mspid,"github.com/chaincode","mychaincodeid","v0");

//lists all the instantiated chaincodes on the peer(s)
//getInstantiatedChaincodes(org1peersurl,org1mspid,'org1')


//invokes a function specified in the instantiated chaincode
//invokechaincode(channel_name,org1mspid,'org1',org1peersurl,org2peersurl,"mychaincodeid","acc1","acc2","30")


//makes a query call to a function specified in the instantiated chaincode
//querychaincode(channel_name,org1mspid,'org1',org1peersurl,org2peersurl,"mychaincodeid","acc1")


//some extra function to get the channel information
//getChannelInfo();
//getGenesisBlock(org1,'org1')
//getChannelConfig()



function querychaincode(channel_name,orgName,orgPath,apeers,zpeers,chaincodeID,account){

	var targets =[]
	var client = new Client();
	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	for (var i=0;i<apeers.length;i++) {
	
		let peer = apeers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
							}
						);
		targets.push(peer_obj)
		channel.addPeer(peer_obj);
	}
	for (var i=0;i<zpeers.length;i++) {
	
		let peer = zpeers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+"org2"+".example.com/peers/peer"+i+"."+"org2"+".example.com/msp/tlscacerts/tlsca."+"org2"+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+"org2"+".example.com"
							}
						);
						
		targets.push(peer_obj)
		channel.addPeer(peer_obj);
	}

	
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgName
		
	}).then((store) => {
	
		client.setStateStore(store);
		return getSubmitter(client,true,orgPath,orgName);
		
	}).then((admin) => {
	
		return channel.initialize();
		
	}, (err) => {

		console.log('Failed to enroll user admin ',err);
		if(res!=null){
		
			res.send("Failed to enroll user admin")
		}	

	}).then(() => {
	
			tx_id = client.newTransactionID();

			// send query
			var request = {
				chaincodeId: chaincodeID,
				txId: tx_id,
				fcn: 'query',
				args: [account]
			};
			return channel.queryByChaincode(request, targets);
	
	}, (err) => {

		console.log('Failed to initialize the channel: ',err);
		if(res!=null){
		
			res.send("Failed to initialize the channel")
		}	

	}).then((response_payloads) =>{
	
		if (response_payloads) {
			
			console.log(response_payloads[0].toString('utf8'));
			if(res!=null){
		
				res.send(response_payloads[0].toString('utf8'))
			}	
		} else {
			console.log('response_payloads is null');
		}
		
	},(err) => {
		console.log('Failed to send query due to error: ',err);
	});
}

function invokechaincode(channel_name,orgName,orgPath,apeers,zpeers,chaincodeId,from,to,amount){

	var client = new Client();
	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	for (var i=0;i<apeers.length;i++) {
	
		let peer = apeers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
							}
						);
		
		channel.addPeer(peer_obj);
	}
	for (var i=0;i<zpeers.length;i++) {
	
		let peer = zpeers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+"org2"+".example.com/peers/peer"+i+"."+"org2"+".example.com/msp/tlscacerts/tlsca."+"org2"+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+"org2"+".example.com"
							}
						);
		channel.addPeer(peer_obj);
	}

	
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgName
		
	}).then((store) => {
	
		client.setStateStore(store);
		return getSubmitter(client,true,orgPath,orgName);
		
	}).then((admin) => {
	
		return channel.initialize();
		
	}, (err) => {

		console.log('Failed to enroll user admin ',err);
		if(res!=null){
			res.send("Error: "+err)
		}

	}).then(() => {
	
			tx_id = client.newTransactionID();
		
			// send proposal to endorser
			var request = {
				chaincodeId : chaincodeId,
				fcn: 'move',
				args: [from,to,amount],
				txId: tx_id,
			};
			return channel.sendTransactionProposal(request);
	
	}, (err) => {

		console.log('Failed to initialize the channel: ',err);
		if(res!=null){
			res.send("Error: "+err)
		}

	}).then((results) =>{
	
		pass_results = results;
		console.log("Results: ",results)
		var proposalResponses = pass_results[0];

		var proposal = pass_results[1];
		var all_good = true;
		for(var i in proposalResponses) {
			let one_good = false;
			let proposal_response = proposalResponses[i];
			if( proposal_response.response && proposal_response.response.status === 200) {
				console.log('transaction proposal has response status of good');
				one_good = channel.verifyProposalResponse(proposal_response);
				if(one_good) {
					console.log(' transaction proposal signature and endorser are valid');
				}
			} else {
				console.log('transaction proposal was bad');
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			
			all_good = channel.compareProposalResponseResults(proposalResponses);
			if(all_good){
				console.log(' All proposals have a matching read/writes sets');
			}
			else {
				console.log(' All proposals do not have matching read/write sets');
			}
		}
		if (all_good) {
			// check to see if all the results match
			console.log('Successfully sent Proposal and received ProposalResponse');
			console.log('Successfully sent Proposal and received ProposalResponse: ', proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal
			};
			var deployId = tx_id.getTransactionID();
			eh = client.newEventHub();
			let data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer0."+orgPath+".example.com/tls/ca.crt");
			eh.setPeerAddr(apeers[0].eventurl, {
					pem: Buffer.from(data).toString(),
					'ssl-target-name-override': 'peer0.'+orgPath+'.example.com'
			});
			eh.connect();
				
			let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						eh.disconnect();
						reject();
					}, 30000);

					eh.registerTxEvent(deployId, (tx, code) => {
						console.log('The chaincode invoke transaction has been committed on peer ',eh._ep._endpoint.addr);
						clearTimeout(handle);
						eh.unregisterTxEvent(deployId);
						eh.disconnect();
						if (code !== 'VALID') {
							console.log('The chaincode invoke transaction was invalid, code = ',code);
							reject();
							
						} else {
							console.log('The chaincode invoke transaction was valid.');
							resolve();
							
						}
					});
			});
			var sendPromise = channel.sendTransaction(request);
			
			return Promise.all([sendPromise].concat([txPromise])).then((results) => {
				console.log('Event promise all complete and testing complete');
				return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
			}).catch((err) => {
				console.log('Failed to send instantiate transaction and get notifications within the timeout period:P ', err)
				return 'Failed to send instantiate transaction and get notifications within the timeout period.';
			});
		
		}
	
	}).then((response) => {

		if (response.status === 'SUCCESS') {
			console.log('Successfully sent transaction to the orderer.');
			if(res!=null){
			
				res.send("Successfully executed transaction")
			}
		} else {
			console.log('Failed to order the transaction. Error code: ',err);
			if(res!=null){
			
				res.send("Error: "+err)
			}
			
		}
	}, (err) => {

		console.log('Failed to send transaction due to error: ',err);
		if(res!=null){
			
			res.send("Error: "+err)
		}
		
	});
	
}

function getallChannels(peers,orgmspid,orgPath){

	targets=[];
	for (var i=0;i<peers.length;i++) {
	
		let peer = peers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
							}
						);
		
		targets.push(peer_obj);
	}

	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgmspid
		
	}).then((store) => {
	
		console.log("\nRegistering orderer admin")
		client.setStateStore(store);
		return getAdmin(client,orgPath,orgmspid)
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled org1 \'admin\'');
		console.log('\nGetting the channel list from peer');
		return client.queryChannels(targets[0])
		
	}).then((ChannelQueryResponse) =>{
	
		console.log('\nChannel info: ',ChannelQueryResponse);
	
	});
	
}

function getInstantiatedChaincodes(peers,orgName,orgPath){

	var client = new Client();
	var targets = [];
	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	for (var i=0;i<peers.length;i++) {
	
		let peer = peers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
							}
						);
		
		targets.push(peer_obj);
		//channel.addPeer(peer_obj);
	}
	//channel.addPeer(peer_obj);
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgName
		
	}).then((store) => {
	
		console.log("\nRegistering orderer admin")
		client.setStateStore(store);
		
		return getSubmitter(client, true, orgPath,orgName)
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled org1 \'admin\'');

		console.log('\Getting the channel info block from orderer');
		
		return channel.queryInstantiatedChaincodes(targets[0])
		
	}).then((ChaincodeQueryResponse) =>{
	
		console.log('\Chaincodes: ',ChaincodeQueryResponse);
	
	});
	
}


function instantiateChaincode(channel_name,peers,bpeers,orgPath,orgName,chaincodePath,chaincodeID,chaincodeVersion,res){

	Client.setConfigSetting('request-timeout', 10000);
	var type = 'instantiate';
	var targets = [];
	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	
	for (var i=0;i<peers.length;i++) {
	
		let peer = peers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
							}
						);
		
		targets.push(peer_obj);
		channel.addPeer(peer_obj);
	}
	
	for (var i=0;i<bpeers.length;i++) {
	
		let peer = bpeers[i];
		data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+"org2"+".example.com/peers/peer"+i+"."+"org2"+".example.com/msp/tlscacerts/tlsca."+"org2"+".example.com-cert.pem");
	
		let peer_obj = client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+"org2"+".example.com"
							}
						);
		
		targets.push(peer_obj);
		channel.addPeer(peer_obj);
	}
	
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgName
		
	}).then((store) => {
	
		console.log("\nRegistering "+orgPath+" admin")
		client.setStateStore(store);
		return getSubmitter(client,true,orgPath,orgName);
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled '+orgPath+' \'admin\'');
		return channel.initialize();
		
	}, (err) => {

		console.log('Failed to enroll user admin ',err);
		if(res!=null){
			res.send("Error: "+err)
		}
		

	}).then(() => {
	
			console.log('\nBuilding instantiate proposal');
			let request = buildChaincodeProposal(client, chaincodePath, chaincodeVersion, false, "",chaincodeID);
			tx_id = request.txId;
			console.log('\nSending instantiate request to peers');
			return channel.sendInstantiateProposal(request);
	
	}, (err) => {

		console.log('Failed to initialize the channel: ',err);
		if(res!=null){
			res.send("Error: "+err)
		}
		
	}).then((results) => {
		
		var proposalResponses = results[0];
		var proposal = results[1];
		var all_good = true;
		for (var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
				one_good = true;
				console.log('instantiate proposal was good');
			} else {
				console.log('instantiate proposal was bad');
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
		
				console.log('Successfully sent Proposal and received ProposalResponse:',
						proposalResponses[0].response.status, proposalResponses[0].response.message,
						proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);
						
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
				var deployId = tx_id.getTransactionID();
				
				eh = client.newEventHub();
				let data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer0."+orgPath+".example.com/tls/ca.crt");
				eh.setPeerAddr(peers[0].eventurl, {
					pem: Buffer.from(data).toString(),
					'ssl-target-name-override': 'peer0.'+orgPath+'.example.com'
				});
				eh.connect();
				
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						eh.disconnect();
						reject();
					}, 30000);

					eh.registerTxEvent(deployId, (tx, code) => {
						console.log('The chaincode instantiate transaction has been committed on peer ',eh._ep._endpoint.addr);
						clearTimeout(handle);
						eh.unregisterTxEvent(deployId);
						eh.disconnect();
						if (code !== 'VALID') {
							console.log('The chaincode instantiate transaction was invalid, code = ',code);
							if(res!=null){
								res.send("The chaincode instantiate transaction was invalid")
							}
							reject();
						} else {
							console.log('The chaincode instantiate transaction was valid.');
							resolve();
							if(res!=null){
								res.send("The chaincode instantiate transaction was valid")
							}
						}
					});
				});
				
				var sendPromise = channel.sendTransaction(request);
				return Promise.all([sendPromise].concat([txPromise])).then((results) => {
					
					console.log('Event promise all complete and testing complete');
					return results[0]; 
				
				}).catch((err) => {
					console.log('Failed to send instantiate transaction and get notifications within the timeout period: ' ,err);
					return 'Failed to send instantiate transaction and get notifications within the timeout period.';
				});
		
		} else {
		
			console.log('Failed to send instantiate Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	
	},(err) => {
	
		console.log('Failed to send instantiate proposal due to error: ',err);
		if(res!=null){
			res.send("Error: "+err)
		}
		
	}).then((response) => {
	
		if (response.status === 'SUCCESS') {
		
			console.log('Successfully sent transaction to the orderer.');
			
		} else {
			console.log('Failed to order the transaction. Error code: ',response);
			if(res!=null){
				res.send("Error: "+response)
			}
		}
	}, (err) => {
		console.log('Failed to send instantiate due to error: ',err);
		if(res!=null){
			res.send("Error: "+err)
		}
	});
}

function installchaincode(peers,orgPath,orgmspid,chaincodepath,chaincodeid,chaincodeversion){
	
	var targets = [];

	for (var i=0;i<peers.length;i++) {
		
			let peer = peers[i];
			data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
		
			let peer_obj = client.newPeer(
								peer.url,
								{
									pem: Buffer.from(data).toString(),
									'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
								}
							);
			
			targets.push(peer_obj);
	}
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgmspid
		
	}).then((store) => {
	
		console.log("\nRegistering "+orgPath+" admin")
		client.setStateStore(store);
		return getAdmin(client,orgPath,orgmspid)
		
	}).then((admin) => {
		
		console.log('\nSuccessfully enrolled '+orgPath+' \'admin\'');
		
		// send proposal to endorser
		console.log("\nBuilding the request object")
		
		var request = {
			targets: targets,
			chaincodePath: chaincodepath,
			chaincodeId: chaincodeid,
			chaincodeVersion: chaincodeversion
		};
		
		console.log("\nSending the install chaincode request to peers\n")
		
		return client.installChaincode(request);
		
	},(err) => {
		
		console.log('Failed to enroll user \'admin\'. ' + err);
		if(res!=null){
			res.send("Error: "+err)
		}

	}).then((results) => {
		
		
		var proposalResponses = results[0];
		var proposal = results[1];
		var all_good = true;
		var errors = [];
		for(var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[i].response && proposalResponses[i].response.status === 200) {
				one_good = true;
				
			} else {
				one_good = false;
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			console.log('\nSuccessfully sent install Proposal and received ProposalResponse: Status 200');
		}
	},
	(err) => {
		console.log('Failed to send install proposal due to error: ',err)
	});
}


function getChannelConfig(){

	var signatures = [];
	
	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+'orderer'
		
	}).then((store) => {
	
		console.log("\nRegistering orderer admin")
		client.setStateStore(store);
		//return getSubmitter(client, true, 'org1',org1);
		return getOrdererAdmin(client);
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled orderer');
		tx_id = client.newTransactionID();
		let request = {
			txId : 	tx_id
		};
		return channel.getChannelConfig();
		
	}).then((envelope) =>{
	
		console.log("\n",envelope)
		
	});
		
		//var config  = envelope.getConfig().toBuffer()
		/*let envelope_bytes = fs.readFileSync('/network-setup/channel-artifacts/newgenesis.block');
		config = client.extractChannelConfig(envelope_bytes);
		
		console.log("\n",config)
		//config = client.extractChannelConfig(env);
		//console.log("\n",envelope.config.channel_group.groups.map.Consortiums.value.groups)
		var signature = client.signChannelConfig(config);
		var string_signature = signature.toBuffer().toString('hex');
		signatures.push(string_signature);
		signatures.push(string_signature);
		let tx_id = client.newTransactionID();
					
		var request = {
			config: config,
			signatures : signatures,
			name : "testchainid",
			orderer : orderer,
			txId  : tx_id
		};
		// send create request to orderer
		return client.updateChannel(request);
		
	}).then((result) => {
				
					console.log('\ncompleted the update channel request');
					console.log('\nresponse: ',result);
					console.log('\nSuccessfully updated the channel.');
					
					if(result.status && result.status === 'SUCCESS') {
						console.log('\nSuccessfully updated the channel...SUCCESS 200');
					} else {
						console.log('\nFailed to updated the channel. ');
					}
		}, (err) => {
					console.log('\nFailed to updated the channel: ' , err);
					
	}).then((nothing) => {
					console.log('\nSuccessfully waited to make sure new channel was updated.');
		}, (err) => {
					console.log('\nFailed to sleep due to error: ', err);
					
	});*/

}


function addOrganizationtoChannel(orgPath,orgName){

	var signatures = [];
	
	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+'orderer'
		
	}).then((store) => {
	
		console.log("\nRegistering orderer admin")
		client.setStateStore(store);
		//return getSubmitter(client, true, orgPath,orgName);
		return getOrdererAdmin(client);
		
	}).then((admin) => {
	
		let config = fs.readFileSync('/network-setup/channel-artifacts/config_update.pb');
		//config = client.extractChannelConfig(envelope_bytes);
		var signature = client.signChannelConfig(config);
		var string_signature = signature.toBuffer().toString('hex');
		signatures.push(string_signature);
		signatures.push(string_signature);
		let tx_id = client.newTransactionID();
					
		var request = {
			config: config,
			signatures : signatures,
			name : "testchainid",
			orderer : orderer,
			txId  : tx_id
		};
		// send create request to orderer
		return client.updateChannel(request);
		
	}).then((result) => {
				
					console.log('\ncompleted the update channel request');
					console.log('\nresponse: ',result);
					console.log('\nSuccessfully updated the channel.');
					
					if(result.status && result.status === 'SUCCESS') {
						console.log('\nSuccessfully updated the channel...SUCCESS 200');
					} else {
						console.log('\nFailed to updated the channel. ');
					}
		}, (err) => {
					console.log('\nFailed to updated the channel: ' , err);
					
	}).then((nothing) => {
					console.log('\nSuccessfully waited to make sure new channel was updated.');
		}, (err) => {
					console.log('\nFailed to sleep due to error: ', err);
					
	});
		
}

function getGenesisBlock(orgName,orgPath){

	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgName
		
	}).then((store) => {
	
		console.log("\nRegistering orderer admin")
		client.setStateStore(store);
		return getSubmitter(client, true, orgPath,orgName);
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled '+orgPath+' \'admin\'');
		
		tx_id = client.newTransactionID();
		let request = {
			txId : 	tx_id
		};
		console.log('\Getting the genesis block from orderer');
		
		return channel.getGenesisBlock(request);
		
	}).then((block) =>{
	
		console.log("\n",block)
		buf  = new Buffer(block)
		console.log("\n",buf)

	})
}

function getChannelInfo(){

	data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/msp/tlscacerts/tlsca.org2.example.com-cert.pem");
	var channel = client.newChannel(channel_name);
	var peer = client.newPeer(
							"grpcs://localhost:10051",
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer1.org2.example.com"
							}
	);
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+org2
		
	}).then((store) => {
	
		console.log("\nRegistering orderer admin")
		client.setStateStore(store);
		
		return getSubmitter(client, true, "org2",org2)
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled org1 \'admin\'');

		console.log('\Getting the channel info block from orderer');
		
		return channel.queryInfo(peer)
		
	}).then((info) =>{
	
		console.log('\Channel info: ',info);
	
	});
	
					
	

}

function createChannel(channel_name,org1mspid,org1dir){


			
			Client.newDefaultKeyValueStore({
					
					path: "/hfc-test-kvs/"+org1mspid
					
			}).then((store) => {

					console.log("\nCreate a storage for Org1 certs");
					client.setStateStore(store);
					console.log("\nEnrolling Admin for Org1");
					return getAdmin(client, org1dir,org1mspid);
					
			}).then((admin) =>{
				
						console.log('\nSuccessfully enrolled admin for Org1');

						console.log('\nread the mychannel.tx file for signing');
						
						let envelope_bytes = fs.readFileSync('/network-setup/channel-artifacts/channel.tx');
						
						config = client.extractChannelConfig(envelope_bytes);
						
						console.log('\nSigning the channel config');
						
						var signature = client.signChannelConfig(config);
						var string_signature = signature.toBuffer().toString('hex');
						
						signatures.push(string_signature);
						signatures.push(string_signature);
				
						// build up the create request
					
						let tx_id = client.newTransactionID();
						
						var request = {
							config: config,
							signatures : signatures,
							name : channel_name,
							orderer : orderer,
							txId  : tx_id
						};
						// send create request to orderer
						return client.createChannel(request);
					
			}).then((result) => {
				
					console.log('\ncompleted the create channel request');
					console.log('\nresponse: ',result);
					console.log('\nSuccessfully created the channel.');
					
					if(result.status && result.status === 'SUCCESS') {
						console.log('\nSuccessfully created the channel...SUCCESS 200');
					} else {
						console.log('\nFailed to create the channel. ');
					}
				}, (err) => {
					console.log('\nFailed to create the channel: ' , err);
					
			}).then((nothing) => {
					console.log('\nSuccessfully waited to make sure new channel was created.');
				}, (err) => {
					console.log('\nFailed to sleep due to error: ', err);
					
			});

}
 
function joinChannel(mspID,orgPath,peers){


	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	var targets = [];
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+mspID
		
	}).then((store) => {
	
		console.log("\nRegistering "+orgPath+" admin")
		client.setStateStore(store);
		return getAdmin(client,orgPath,mspID);
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled '+orgPath+' \'admin\'');
		tx_id = client.newTransactionID();
		
		let request = {
			txId : 	tx_id
		};
		
		console.log('\nGetting the genesis block from orderer');
		
		return channel.getGenesisBlock(request);
		
	}).then((block) =>{
	
		console.log('\nSuccessfully got the genesis block');
		genesis_block = block;		
		console.log('\nEnrolling org1 admin');
		
		return getAdmin(client,orgPath,mspID);
		
	}).then((admin) => {
	
		console.log('\nSuccessfully enrolled org:' + mspID + ' \'admin\'');
		
		for (var i=0;i<peers.length;i++) {
		
			let peer = peers[i];
			data = fs.readFileSync("/network-setup/crypto-config/peerOrganizations/"+orgPath+".example.com/peers/peer"+i+"."+orgPath+".example.com/msp/tlscacerts/tlsca."+orgPath+".example.com-cert.pem");
			targets.push(
					client.newPeer(
							peer.url,
							{
								pem: Buffer.from(data).toString(),
								'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
							}
					)
			);
		}
		
		tx_id = client.newTransactionID();
		let request = {
			targets : targets,
			block : genesis_block,
			txId : 	tx_id
		};
		
		return channel.joinChannel(request);
		
	}, (err) => {
	
		console.log('Failed to enroll user admin due to error: ' + err);
		
	}).then((results) => {
	
		console.log('\nResponse of one peer: ',results[0]);
		
		if(results[0] && results[0].response && results[0].response.status == 200) {
		
			console.log('\nPeers successfully joined the channel');
			
		} else {
		
			console.log(' Failed to join channel');
		}
	}, (err) => {
	
		console.log('Failed to join channel due to error: ' + err);
		
	});
	
}

function getOrdererAdmin(client){

	var keyPath = '/network-setup/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore';
	var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
	var certPath = '/network-setup/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts';
	var certPEM = readAllFiles(certPath)[0];
	
	return Promise.resolve(client.createUser({
		
		username: 'ordererAdmin',
		mspid: 'OrdererMSP',
		cryptoContent: {
			privateKeyPEM: keyPEM.toString(),
			signedCertPEM: certPEM.toString()
		}
	}));
}

function getSubmitter(client, peerOrgAdmin,org,pathOrg){

		var peerAdmin, userOrg;
		if (typeof peerOrgAdmin === 'boolean') {
			peerAdmin = peerOrgAdmin;
		} else {
			peerAdmin = false;
		}
		if (typeof peerOrgAdmin === 'string') {
			userOrg = peerOrgAdmin;
		} else {
		
			if (typeof org === 'string') {
				userOrg = org;
			} else {
				userOrg = 'org1';
			}
		}
		if (peerAdmin) {
			return getAdmin(client,userOrg,pathOrg);
		} else {
			return getMember('admin', 'adminpw', client, test, userOrg);
		}
}

function getAdmin(client, userOrg,mspID){

	var keyPath = '/network-setup/crypto-config/peerOrganizations/'+userOrg+'.example.com/users/Admin@'+userOrg+'.example.com/msp/keystore';
	var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
	var certPath = '/network-setup/crypto-config/peerOrganizations/'+userOrg+'.example.com/users/Admin@'+userOrg+'.example.com/msp/signcerts';
	var certPEM = readAllFiles(certPath)[0];
	// var cryptoSuite = Client.newCryptoSuite();
	// if (userOrg) {
		// cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: "/hfc-test-kvs/"+pathOrg}));
		// client.setCryptoSuite(cryptoSuite);
	// }

	return Promise.resolve(client.createUser({
		username: 'peer'+userOrg+'Admin',
		mspid: mspID,
		cryptoContent: {
			privateKeyPEM: keyPEM.toString(),
			signedCertPEM: certPEM.toString()
		}
	}));

}

function readAllFiles(dir) {
	var files = fs.readdirSync(dir);
	var certs = [];
	files.forEach((file_name) => {
		let file_path = path.join(dir,file_name);
		let data = fs.readFileSync(file_path);
		certs.push(data);
	});
	return certs;
}
function buildChaincodeProposal(client, chaincode_path, version, upgrade, transientMap,chaincodeID){
	
	var tx_id = client.newTransactionID();

	// send proposal to endorser
	var request = {
		chaincodePath: chaincode_path,
		chaincodeId: chaincodeID,
		chaincodeVersion: version,
		fcn: 'init',
		args: ["acc1","100","acc2","200"],
		txId: tx_id,
		// use this to demonstrate the following policy:
		// 'if signed by org1 admin, then that's the only signature required,
		// but if that signature is missing, then the policy can also be fulfilled
		// when members (non-admin) from both orgs signed'
		'endorsement-policy': {
			identities: [
				{ role: { name: 'member', mspId: org1mspid }},
				{ role: { name: 'member', mspId: org2mspid }},
				{ role: { name: 'admin', mspId: org1mspid}}
			],
			policy: {
				'1-of': [
					{ 'signed-by': 2},
					{ '2-of': [{ 'signed-by': 0}, { 'signed-by': 1 }]}
				]
			}
		}
	};

	if(upgrade) {
		// use this call to test the transient map support during chaincode instantiation
		request.transientMap = transientMap;
	}

	return request;

}