var Client = require('fabric-client');
var fs = require('fs');
var path = require('path');
var JSONB = require('json-buffer')
var grpc =require('grpc');

var channel_name = 'firstchannel';
var org1 = "Org1MSP";
var org2 = "Org2MSP"
var org3 = "Org3MSP"
var genesis_block = null;
var config =null;
var signatures = [];
var apeers = [{url:"grpcs://localhost:7051",eventurl:"grpcs://localhost:7053"},{url:"grpcs://localhost:8051",eventurl:"grpcs://localhost:8053"}];
var bpeers = [{url:"grpcs://localhost:9051",eventurl:"grpcs://localhost:9053"},{url:"grpcs://localhost:10051",eventurl:"grpcs://localhost:10053"}];


var client = new Client();
var caRootsPath = "/network-setup/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
let data = fs.readFileSync(caRootsPath);
let caroots = Buffer.from(data).toString();
var _configtxProto = grpc.load(__dirname + '/node_modules/fabric-client/lib/protos/common/configtx.proto').common;

var orderer = client.newOrderer(
		"grpcs://localhost:7050",
		{
			'pem': caroots,
			'ssl-target-name-override': 'orderer.example.com'
		}
);
//joinChannel(org1,'org1',apeers)
//joinChannel(org2,'org2',bpeers)
//createChannel();
//getChannelInfo();
//getGenesisBlock(org1,'org1')
//addOrganizationtoChannel('org1',org1);
//test();
//getallChannels(apeers,org1,'org1')
//getChannelConfig()
//installchaincode(channel_name,apeers,'org1',org1,"github.com/chaincode","mychaincodeid","v0");
//installchaincode(channel_name,bpeers,'org2',org2,"github.com/chaincode","mychaincodeid","v0");
//instantiateChaincode(channel_name,apeers,bpeers,'org1',org1,"github.com/chaincode","mychaincodeid","v0");
//getInstantiatedChaincodes(apeers,org1,'org1')
//invokechaincode(channel_name,org1,'org1',apeers,bpeers,"mychaincodeid","key","first transaction",null)
//querychaincode(channel_name,org1,'org1',apeers,bpeers,"mychaincodeid","key")

function querychaincode(channel_name,orgName,orgPath,apeers,zpeers,chaincodeID,chaincodeKey,res){

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
				args: [chaincodeKey]
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

function invokechaincode(channel_name,orgName,orgPath,apeers,zpeers,chaincodeId,chaincodeKey,value,res){

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
				fcn: 'invoke',
				args: [chaincodeKey,value],
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

function getallChannels(peers,orgName,orgPath){

	var client = new Client();
	var targets = [];
	//channel.addOrderer(orderer)
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
		
		return client.queryChannels(targets[0])
		
	}).then((ChannelQueryResponse) =>{
	
		console.log('\Channel info: ',ChannelQueryResponse);
	
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

	var type = 'instantiate';
	var targets = [];
	var client = new Client();
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
	
			let request = buildChaincodeProposal(client, chaincodePath, chaincodeVersion, false, "",chaincodeID);
			tx_id = request.txId;
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

function installchaincode(channel_name,peers,orgPath,orgName,chaincodepath,chaincodeid,chaincodeversion){
	
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
	Client.newDefaultKeyValueStore({
		
		path: "/hfc-test-kvs/"+orgName
		
	}).then((store) => {
	
		client.setStateStore(store);
		return getSubmitter(client,true,orgPath,orgName);
		
	}).then((admin) => {
		
		
		// send proposal to endorser
		var request = {
			targets: targets,
			chaincodePath: chaincodepath,
			chaincodeId: chaincodeid,
			chaincodeVersion: chaincodeversion
		};
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
			console.log('Successfully sent install Proposal and received ProposalResponse: Status 200');
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
function createChannel(){



			Client.newDefaultKeyValueStore({
					
					path: "/hfc-test-kvs/"+"orderer"
					
			}).then((store) => {

					console.log("\nCreate a storage for Org1MSP certs");
					
					client.setStateStore(store);
					var cryptoSuite = Client.newCryptoSuite();
					cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: "/hfc-test-kvs/"+"orderer"}));
					client.setCryptoSuite(cryptoSuite);
					
					console.log("\nEnrolling Admin for Orderer");
					
					return getOrdererAdmin(client);
					
			}).then((admin) =>{
				
						console.log('\nSuccessfully enrolled user \'admin\' for orderer');

						console.log('\nread the mychannel.tx file for signing');
						
						let envelope_bytes = fs.readFileSync('/network-setup/channel-artifacts/channel.tx');
						
						config = client.extractChannelConfig(envelope_bytes);
						
						console.log('\nSuccessfull extracted the config update from the configtx envelope');
						
						client._userContext = null;
						
						console.log("\nEnrolling Admin for Org1MSP");
						
						return getSubmitter(client, true, 'org1',org1);
								
								
			}).then((admin) => {
				
				
					console.log('\nSuccessfully enrolled user \'admin\' for org1');
					
					console.log('\nSigning the mychannel.tx artifacts by Org1 admin');

					var signature = client.signChannelConfig(config);
					var string_signature = signature.toBuffer().toString('hex');
					
					console.log('\nSuccessfully signed config update');
					
					signatures.push(string_signature);
					signatures.push(string_signature);
					
					client._userContext = admin;
					
					
					console.log("\nEnrolling Admin for Org2MSP");
					
					//return getOrdererAdmin(client);
					return getSubmitter(client, true, 'org2',org2);
					
			}).then((admin) => {
				
					console.log('\nSuccessfully enrolled user \'admin\' for org2');

					console.log('\nSigning the mychannel.tx artifacts by Org2 admin');
					
					var signature = client.signChannelConfig(config);
					
					console.log('\nSuccessfully signed config update');
					
					signatures.push(signature);
					signatures.push(signature);
					
					client._userContext = null;
					console.log("\nEnrolling Admin for Orderer for final create channel transaction");
					
					return getOrdererAdmin(client);
					
			}).then((admin) => {
				
					console.log('\nSuccessfully enrolled user \'admin\' for orderer');
					the_user = admin;

					console.log('\nSigning the mychannel.tx artifacts by orderer admin');
					
					var signature = client.signChannelConfig(config);
					console.log('\nSuccessfully signed config update');
					
					signatures.push(signature);
					signatures.push(signature);

					console.log('\ndone signing');

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
 
function joinChannel(orgName,orgPath,peers){


	var channel = client.newChannel(channel_name);
	channel.addOrderer(orderer)
	var targets = [],
	eventhubs = [];
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
	
		console.log('Successfully got the genesis block',block);
		genesis_block = block;

		// get the peer org's admin required to send join channel requests
		client._userContext = null;
		
		console.log('Enrolling org1 admin');
		
		return getSubmitter(client, true, orgPath,orgName);
		
	}).then((admin) => {
	
		console.log('Successfully enrolled org:' + orgName + ' \'admin\'');
		
		the_user = admin;
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
			let eh = client.newEventHub();
			eh.setPeerAddr(
				peer.eventurl,
				{
							pem: Buffer.from(data).toString(),
							'ssl-target-name-override': "peer"+i+"."+orgPath+".example.com"
				}
			);
			
			eh.connect();
			eventhubs.push(eh);
		
		}
		var eventPromises = [];
		eventhubs.forEach((eh) => {
		
			let txPromise = new Promise((resolve, reject) => {
				let handle = setTimeout(reject, 30000);

				eh.registerBlockEvent((block) => {
					clearTimeout(handle);
					// in real-world situations, a peer may have more than one channel so
					// we must check that this block came from the channel we asked the peer to join
					if(block.data.data.length === 1) {
						// Config block must only contain one transaction
						var channel_header = block.data.data[0].payload.header.channel_header;
						if (channel_header.channel_id === channel_name) {
							console.log('The new channel has been successfully joined on peer '+ eh.getPeerAddr());
							resolve();
						}
						else {
							console.log('The new channel has not been succesfully joined');
							reject();
						}
					}
				});
			});

			eventPromises.push(txPromise);
		});
		
		tx_id = client.newTransactionID();
		let request = {
			targets : targets,
			block : genesis_block,
			txId : 	tx_id
		};
		let sendPromise = channel.joinChannel(request);
		return Promise.all([sendPromise].concat(eventPromises));
		
	}, (err) => {
	
		console.log('Failed to enroll user \'admin\' due to error: ' + err);
		
	}).then((results) => {
	
		console.log('\nJoin Channel R E S P O N S E : ', results);

		if(results[0] && results[0][0] && results[0][0].response && results[0][0].response.status == 200) {
		
			console.log('Successfully joined peers in organization to join the channel');
			
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

function getSubmitter(client, peerOrgAdmin, org,pathOrg){

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

function getAdmin(client, userOrg,pathOrg){

	var keyPath = '/network-setup/crypto-config/peerOrganizations/'+userOrg+'.example.com/users/Admin@'+userOrg+'.example.com/msp/keystore';
	var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
	var certPath = '/network-setup/crypto-config/peerOrganizations/'+userOrg+'.example.com/users/Admin@'+userOrg+'.example.com/msp/signcerts';
	var certPEM = readAllFiles(certPath)[0];
	var cryptoSuite = Client.newCryptoSuite();
	if (userOrg) {
		cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: "/hfc-test-kvs/"+pathOrg}));
		client.setCryptoSuite(cryptoSuite);
	}

	return Promise.resolve(client.createUser({
		username: 'peer'+userOrg+'Admin',
		mspid: pathOrg,
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
		args: [],
		txId: tx_id,
		// use this to demonstrate the following policy:
		// 'if signed by org1 admin, then that's the only signature required,
		// but if that signature is missing, then the policy can also be fulfilled
		// when members (non-admin) from both orgs signed'
		'endorsement-policy': {
			identities: [
				{ role: { name: 'member', mspId: org1 }},
				{ role: { name: 'member', mspId: org2 }},
				{ role: { name: 'admin', mspId: org1}}
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