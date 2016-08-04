var request = new XMLHttpRequest();

function parse(){
	request.open("GET", "data.json", true);
	// request.open("GET", "https://messagehub.herokuapp.com/messages.json", true);


	request.onreadystatechange = function(){
		if (request.readyState == 4 && request.status == 200){
			data = request.responseText;
			msg = JSON.parse(data);
			elem = document.getElementById("messages");
			for (i = 0; i < msg.length; i++){
				elem.innerHTML += msg[i].content + " " + msg[i].username + "<br>";
			}
		}
	
		else if (request.readyState == 4 && request.status != 200){
			document.getElementById("messages").innerHTML = "<p>Something failed</p>";
		}
	}

	request.send(null);	


}
