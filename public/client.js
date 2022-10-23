

let myUserName = undefined
let myPlayerID = undefined
let turn = undefined
let awaitMyTurn = false
let openCardsLeft = undefined
let currentPlayers = undefined
let currentTrade = {players:[{id:undefined},{id:undefined}]}
let revealedCards = []
let cards = undefined
let coins = 0
let tradingCards = []
let handCards = []
let tradeHandCards = []
let tradedCardsToPlant = []
let selectedCard = {
    source: undefined,
    card: undefined,
    nextCard: undefined,
    id: undefined
}
let ownacres = [
    {
        type: undefined,
        count: 0,
        momentaryGain: 0,
        locked: false
    },
    {
        type: undefined,
        count: 0,
        momentaryGain: 0,
        locked: false
    },
    {
        type: undefined,
        count: 0,
        momentaryGain: 0,
        locked: true
    }
]
let foreignAcres = []
let currentlyShownAcre = undefined
const socket = io()

async function stageReset(){
    await fetch("/reset", {method:"GET"})
        .then((data)=>{console.log(data)})
}

function reset(){
    socket.emit("rejoin")
    turn = undefined
    awaitMyTurn = false
    openCardsLeft = undefined
    currentPlayers = undefined
    currentTrade = {players:[{id:undefined},{id:undefined}]}
    revealedCards = []
    cards = undefined
    coins = 0
    tradingCards = []
    handCards = []
    tradeHandCards = []
    tradedCardsToPlant = []
    selectedCard = {
        source: undefined,
        card: undefined,
        nextCard: undefined,
        id: undefined
    }
    ownacres = [
        {
            type: undefined,
            count: 0,
            momentaryGain: 0,
            locked: false
        },
        {
            type: undefined,
            count: 0,
            momentaryGain: 0,
            locked: false
        },
        {
            type: undefined,
            count: 0,
            momentaryGain: 0,
            locked: true
        }
    ]
    foreignAcres = []
    currentlyShownAcre = undefined

    document.getElementById("fullscreenBlock").style.display = "block"
    document.getElementById("showTradeRequests").style.display = "none"
    document.getElementById("tradeRequest").style.display = "none"
    document.getElementById("foreignAcres").style.display = "block"
    document.getElementById("trading").style.display = "none"
    document.getElementById("endMove").style.display = "none"
    document.getElementById("tradingButtons").style.display = "block"
    document.getElementById("tradedCards").style.display = "none"
    document.getElementById("tradeDeclined").style.display = "none"
    document.getElementById("revealCards").style.display = "none"
    document.getElementById("buyThirdAcreDiv").style.display = "block"
    document.getElementById("ownAcre3").style.display = "none"
    document.getElementById("coinSlot").style.display = "none"
    document.getElementById("coinNumber").style.display = "none"
    document.getElementById("foreignAcre3").style.display = "none"

    document.getElementById("title").innerHTML = "???"
    document.getElementById("centerCardLeft").innerHTML = "<img src='./pics/questionmark.png' class='card'>"
    document.getElementById("centerCardRight").innerHTML = "<img src='./pics/questionmark.png' class='card'>"
    document.getElementById("tradeRequest").innerHTML = "<h2>Trade anfragen</h2>"
    document.getElementById("tradingAccept").innerHTML = "<h3>Akzeptieren</h3>"
    document.getElementById("ownTradingcardSlot").innerHTML = " "
    document.getElementById("foreignTradingcardSlot").innerHTML = " "
    document.getElementById("handcardContainer").innerHTML = " "
    document.getElementById("ownAcreCenter1").innerHTML = "<img src='./pics/acre1.png' class='card' id='acrePic1' style='width: 150px;left:-23px;'>"
    document.getElementById("ownAcreCenter2").innerHTML = "<img src='./pics/acre2.png' class='card' id='acrePic2' style='width: 150px;left:-23px;'>"
    document.getElementById("ownAcreCenter3").innerHTML = "<img src='./pics/acre3.png' class='card' id='acrePic3' style='width: 150px;left:-23px;'>"
    document.getElementById("tradedCards").innerHTML = " "
    document.getElementById("ownAcreCount").innerHTML = " - 2 - "
    document.getElementById("foreignAcreCenter1").innerHTML = "<img src='./pics/acre1.png' class='card' id='acrePic1' style='width: 150px;left:-23px;'>"
    document.getElementById("foreignAcreCenter2").innerHTML = "<img src='./pics/acre2.png' class='card' id='acrePic2' style='width: 150px;left:-23px;'>"
    document.getElementById("foreignAcreCenter3").innerHTML = "<img src='./pics/acre3.png' class='card' id='acrePic3' style='width: 150px;left:-23px;'>"
    document.getElementById("foreignAcreName").innerHTML = " -  - "
    document.getElementById("coinNumber").innerHTML = "<h2>0 Münzen</h2>"

    document.getElementById("tradeRequest").setAttribute("onclick", "requestTrade(this)")

    document.getElementById("tradingAccept").classList.remove("tradingAcceptActive")
    document.getElementById("tradingAccept").classList.remove("tradeRequestPending")
    document.getElementById("tradeRequest").classList.remove("tradeRequestPending")
    document.getElementById("tradeRequest").classList.remove("acceptTradeRequestActive")

}

socket.on("reset", ()=>{
    reset()
    setTimeout(()=>{socket.connect()}, 1000)
})

socket.on("connect", () => {
    console.log(socket.id)
    myPlayerID = socket.id
    function getUsername(){
        myUserName = prompt("Enter Username", "username")
        socket.emit("getUsername", myUserName, (response)=>{
            if(response.status != "accepted"){
                alert("Username already taken!")
                getUsername()
            } else {
                document.getElementById("myName").innerText = " - " + myUserName + " - "
            }
        })
    }
    getUsername()
});

socket.on("playerList", (data)=>{
    currentPlayers = data
    console.log(currentPlayers)
})

socket.on("startGame", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " a"
    cards = data.cards
    data.handCards.forEach((cardID)=>{changeHandCards("add", cardID)})
    console.log(cards, data.handCards)
    document.getElementById("fullscreenBlock").style.display = "none"
    document.getElementById("title").innerHTML = "Bohnanza"
    let tradeButtonString = ""
    let filteredPlayers = currentPlayers.filter((thisPlayer)=>{
        return thisPlayer.id != myPlayerID
    })
    console.log(filteredPlayers)
    filteredPlayers.forEach((thisPlayer)=>{
        tradeButtonString = tradeButtonString + "<button id='acceptTradeRequest" + thisPlayer.id + "' class='acceptTradeRequest' onclick='requestTrade(this)'><h3>" + thisPlayer.username + "</h3></button>"
        foreignAcres.push({"player":thisPlayer.id, "acres":[{type:undefined,count:0,locked:false},{type:undefined,count:0,locked:false},{type:undefined,count:0,locked:true}]})
    })
    currentlyShownAcre = filteredPlayers[0].id
    document.getElementById("foreignAcreName").innerHTML = " - " + currentPlayers.find((thisPlayer)=>{return thisPlayer.id == currentlyShownAcre}).username + " - "
    console.log(tradeButtonString)
    document.getElementById("showTradeRequests").innerHTML = tradeButtonString
})

socket.on("changeAcre", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - b"
    //{"player": thisPlayer.id, "acres": thisPlayer.acres}
    let editedAcre = foreignAcres.find((thisAcre)=>{return thisAcre.player == data.player})
    editedAcre.acres = data.acres
    if(editedAcre.player == currentlyShownAcre){
        renderForeignAcres(1)
        renderForeignAcres(2)
        if(editedAcre.acres[2].locked == false){
            renderForeignAcres(3)
        }
    }
})

socket.on("move_1", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - c"
    turn = data.turn
    renderTurnQueue()
    if(data.occupiedPlayers){
        if(!data.occupiedPlayers.find((player)=>{return player == myPlayerID})){
            if(data.turn == myPlayerID){
                startMove()
            }
        } else if(data.turn == myPlayerID){
            awaitMyTurn = true
        }
    } else {
        if(data.turn == myPlayerID){
            startMove()
        }
    }
    
    if(turn != myPlayerID){
        currentlyShownAcre = turn
        document.getElementById("foreignAcreName").innerHTML = " - " + currentPlayers.find((thisCurrentPlayer)=>{return thisCurrentPlayer.id == currentlyShownAcre}).username + " - "
        renderForeignAcres(1)
        renderForeignAcres(2)
        if(foreignAcres.find((thisForeignAcre)=>{return thisForeignAcre.player == currentlyShownAcre}).acres[2].locked == false){
            renderForeignAcres(3)
        }
    }
})

function renderTurnQueue(){
    let turnQueueString = "<font size='+2'>"
    currentPlayers.forEach((thisCurrentPlayer)=>{
        if(thisCurrentPlayer.id == turn){
            turnQueueString += "<span style='color: gold; text-decoration-line: underline; font-size:xx-large'>" + thisCurrentPlayer.username + "</span><br>"
        } else {
            turnQueueString += thisCurrentPlayer.username + "<br>"
        }
        
    })
    turnQueueString += "<br></font>"
    document.getElementById("turnQueue").innerHTML = turnQueueString
}

function startMove(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - d"
    if(handCards.length == 0){
        revealCards()
    } else {
        const handCardList = document.getElementsByClassName("handCard")
        selectCard(handCardList[handCardList.length-1].id, "handCard")
        if(handCards.length == 1){
            selectedCard.nextCard = false
        } else {
            selectedCard.nextCard = true
        }
    }
}

socket.on("move_2", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - e"
    revealedCards = [data.cards[0], data.cards[1]]
    openCardsLeft = 2
    document.getElementById("centerCardLeft").innerHTML = "<img id='centerCardLeftImage' src='./pics/" + cards.find((card)=>{return card.id == revealedCards[0]}).image + "' class='card'>"
    document.getElementById("centerCardRight").innerHTML = "<img id='centerCardRightImage' src='./pics/" + cards.find((card)=>{return card.id == revealedCards[1]}).image + "' class='card'>"    
    if(turn == myPlayerID){        
        document.getElementById("showTradeRequests").style.display = "block"
        document.getElementById("centerCardLeftImage").classList.add("highlightOnHover", "pointer")
        document.getElementById("centerCardLeftImage").setAttribute("onclick","selectCard(this.id, 1)")
        document.getElementById("centerCardRightImage").classList.add("highlightOnHover", "pointer")
        document.getElementById("centerCardRightImage").setAttribute("onclick","selectCard(this.id, 2)")
    } else {
        document.getElementById("tradeRequest").style.display = "block"
    }
})

socket.on("centerCardRemove", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - f"
    document.getElementById("centerCard" + data.card).innerHTML = "<img src='./pics/questionmark.png' class='card'>"
})

socket.on("centerCardAdd", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - g"
    console.log(data)
    if(data.card == 1){
        document.getElementById("centerCardLeft").innerHTML = "<img id='centerCardLeftImage' src='./pics/" + cards.find((card)=>{return card.id == revealedCards[0]}).image + "' class='card'>"
        if(turn == myPlayerID){
            document.getElementById("centerCardLeftImage").classList.add("highlightOnHover", "pointer")
            document.getElementById("centerCardLeftImage").setAttribute("onclick","selectCard(this.id, 1)")
        }
    } else if(data.card == 2){
        document.getElementById("centerCardRight").innerHTML = "<img id='centerCardRightImage' src='./pics/" + cards.find((card)=>{return card.id == revealedCards[1]}).image + "' class='card'>"
        if(turn == myPlayerID){
            document.getElementById("centerCardRightImage").classList.add("highlightOnHover", "pointer")
            document.getElementById("centerCardRightImage").setAttribute("onclick","selectCard(this.id, 2)")
        }
    }
})

socket.on("endMoveCards", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - h"
    data.cards.forEach((thisCard)=>{
        changeHandCards("add", thisCard)
    })
})

socket.on("sendTradeRequest", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - i"
    if(turn == myPlayerID){
        let requestButtons = document.getElementsByClassName("acceptTradeRequest")
        for(let i = 0; i < requestButtons.length; i++){
            console.log(requestButtons[i].id.slice(18))
            if(requestButtons[i].id.slice(18) == data.fromPlayer){
                console.log(requestButtons[i].id.slice(18) + "= test")
                requestButtons[i].classList.add("acceptTradeRequestActive")
                requestButtons[i].setAttribute("onclick","acceptTrade('" + data.fromPlayer + "')")
            }
        }
    } else {
        document.getElementById("tradeRequest").innerHTML = "<h2>Handel akzeptieren</h2>"
        document.getElementById("tradeRequest").classList.add("acceptTradeRequestActive")
        document.getElementById("tradeRequest").setAttribute("onclick","acceptTrade('" + data.fromPlayer + "')")
    }
})

socket.on("startTrade", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - j"
    console.log("startTrade", data.trade)
    currentTrade = data.trade
    if(currentTrade.players[0].id == myPlayerID || currentTrade.players[1].id == myPlayerID){

        socket.emit("joinRoom")
        //am trade beteiligt
        tradeHandCards = []
        document.getElementById("tradingAccept").classList.remove("tradingAcceptActive")
        document.getElementById("tradingAccept").innerHTML = "<h3>Akzeptieren</h3>"
        document.getElementById("tradingPartner").innerHTML = " - " + currentPlayers.find((thisPlayer1)=>{return thisPlayer1.id == currentTrade.players.find((thisPlayer2)=>{return thisPlayer2.id != myPlayerID}).id}).username  + " - "
        document.getElementById("foreignAcres").style.display = "none"
        document.getElementById("trading").style.display = "block"
        document.getElementById("endMove").style.display = "none"
        if(turn == myPlayerID){
            let requestButtons = document.getElementsByClassName("acceptTradeRequest")
            for(let i = 0; i < requestButtons.length; i++){
                if(requestButtons[i].id.slice(18) == currentTrade.players[0].id || requestButtons[i].id.slice(18) == currentTrade.players[1].id){
                    requestButtons[i].classList.remove("acceptTradeRequestActive")
                    requestButtons[i].classList.remove("tradeRequestPending")
                    requestButtons[i].innerHTML = "<h3>" + currentPlayers.find((thisPlayer)=>{return thisPlayer.id == requestButtons[i].id.slice(18)}).username + "</h3>"
                    requestButtons[i].setAttribute("onclick", "requestTrade(this)")
                }
            }
        } else {
            document.getElementById("tradeRequest").innerHTML = "<h2>Handel anfragen</h2>"
            document.getElementById("tradeRequest").classList.remove("tradeRequestPending")
            document.getElementById("tradeRequest").classList.remove("acceptTradeRequestActive")
            document.getElementById("tradeRequest").setAttribute("onclick", "requestTrade(this)")
        }
        handCards.forEach((thisCard)=>{
            tradeHandCards.push({card:thisCard, active: true})
        })
        console.log("tradeHandCards:", tradeHandCards)
        let handCardList = document.getElementsByClassName("handCard")
        for(let i = 0; i < handCardList.length; i++){
            handCardList[i].setAttribute("onclick", "selectCard(this.id, 'handCard', " + parseFloat(handCardList[i].id.slice(14)) + ")")
            handCardList[i].classList.add("pointer")
        }
    } else {
        //trade betrifft mihc nicht
    }
})

socket.on("editCurrentTrade", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - k"
    currentTrade = data.currentTrade
    if(currentTrade.players[0].accepted == false && currentTrade.players[1].accepted == false){
        document.getElementById("tradingAccept").classList.remove("tradingAcceptActive")
        document.getElementById("tradingAccept").innerHTML = "<h3>Akzeptieren</h3>"
    }
})

socket.on("modifyTradingCards", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - l"
    console.log(data)
    let renderedCards = ""
    let cardPosition = 0
    let tradingCardNumber = 0
    data.cards.forEach((tradingCard)=>{
        renderedCards = renderedCards + "<img src='./pics/" + cards.find((card)=>{return card.id == tradingCard.card}).image + "' id='tradingCardNumber" + tradingCardNumber + "' class='tradingCard card highlightOnHover pointer' onclick='removeTradingCard(false, " + tradingCardNumber + ")' style='top:" + cardPosition + "px'></img>"
        cardPosition += 20
        tradingCardNumber += 1
    })
    if(data.player == myPlayerID){
        document.getElementById("ownTradingcardSlot").innerHTML = renderedCards
    } else {
        document.getElementById("foreignTradingcardSlot").innerHTML = renderedCards
    }
})

socket.on("tradeFinished", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - m"
    //succesful trade
    console.log("trade finished")
    tradingCards = []
    currentTrade = {
        players: [{
            id: undefined,
            cards: [],
            firstRequest: undefined,
            accepted: false
            },{
            id: undefined,
            cards: [],
            firstRequest: undefined,
            accepted: false
        }]
    }
    document.getElementById("ownTradingcardSlot").innerHTML = " "
    document.getElementById("foreignTradingcardSlot").innerHTML = " "
    document.getElementById("tradingButtons").style.display = "none"
    tradedCardsToPlant = []
    let tradedCardsToPlantTemp = data.currentTrade.players[data.currentTrade.players.findIndex((thisPlayer)=>{return thisPlayer.id != myPlayerID})].cards
    tradedCardsToPlantTemp.forEach((obj)=>{
        tradedCardsToPlant.push(obj.card)
    })
    if(tradedCardsToPlant.length == 0){
        closeTradingMenu()
    } else {
        document.getElementById("tradedCards").style.display = "block"
        renderTradedCardsToPlant()
        console.log(tradedCardsToPlant)
    }
    tradeEnded()
})

socket.on("declineTrade", ()=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - n"
    //declined trade
    if(tradingCards != []){
        removeTradingCard(true)
    }
    let timeValue = 0
    function tradeDeclineAnimation(){
        console.log(timeValue)
        if(timeValue == 0){
            document.getElementById("tradeDeclined").style.display = "block"
        } else if(timeValue > 100){
            document.getElementById("tradeDeclined").style.opacity = Math.abs(2*(timeValue-100)/100-1)
            if(timeValue >= 150){
                clearInterval(animationInterval)
                document.getElementById("tradeDeclined").style.display = "none"
                document.getElementById("tradeDeclined").style.opacity = 1
            }
        }
        timeValue++
    }
    let animationInterval = setInterval(tradeDeclineAnimation, 10)
    tradeEnded()
    closeTradingMenu()
})

function tradeEnded(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - o"
    socket.emit("leaveRoom")
    let handCardList = document.getElementsByClassName("handCard")
    for(let i = 0; i < handCardList.length; i++){
        handCardList[i].setAttribute("onclick", "")
        handCardList[i].classList.remove("pointer")
    }   
}

function closeTradingMenu(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - p"
    socket.emit("changeMyStatus", {"player": myPlayerID, "newOccupiedStatus": false})
    document.getElementById("foreignAcres").style.display = "block"
    document.getElementById("tradingButtons").style.display = "block"
    document.getElementById("trading").style.display = "none"
    if(openCardsLeft == 0 && turn == myPlayerID){
        document.getElementById("endMove").style.display = "block"
    }
    tradeHandCards = []
    tradingCards = []
    tradedCardsToPlant = []
    if(awaitMyTurn == true){
        awaitMyTurn = false
        startMove()
    }
}

socket.on("tradeCompleted", ()=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - q"
    document.getElementById("ownTradingcardSlot").innerHTML = " "
    document.getElementById("foreignTradingcardSlot").innerHTML = " "
    currentTrade = {
        players: [{
            id: undefined,
            firstRequest: undefined,
            accepted: false
            },{
            id: undefined,
            firstRequest: undefined,
            accepted: false
        }]
    }
})

socket.on("endMove", ()=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - r"
    document.getElementById("endMove").style.display = "none"
    document.getElementById("showTradeRequests").style.display = "none"
    document.getElementById("tradeRequest").style.display = "none"

    let requestButtons = document.getElementsByClassName("acceptTradeRequest")
    for(let i = 0; i < requestButtons.length; i++){
        requestButtons[i].classList.remove("acceptTradeRequestActive")
        requestButtons[i].classList.remove("tradeRequestPending")
        requestButtons[i].innerHTML = "<h3>" + currentPlayers.find((thisPlayer)=>{return thisPlayer.id == requestButtons[i].id.slice(18)}).username + "</h3>"
        requestButtons[i].setAttribute("onclick", "requestTrade(this)")
    }
    document.getElementById("tradeRequest").innerHTML = "<h2>Handel anfragen</h2>"
    document.getElementById("tradeRequest").classList.remove("tradeRequestPending")
    document.getElementById("tradeRequest").classList.remove("acceptTradeRequestActive")
    document.getElementById("tradeRequest").setAttribute("onclick", "requestTrade(this)")
})

socket.on("gameFinished", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - s"
    document.getElementById("fullscreenBlock").style.display = "block"
    console.log("game Finished")
    console.log("players:", data.players)
})

socket.on("stopGame", (data)=>{
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - t"
    document.getElementById("fullscreenBlock").style.display = "block"
    console.log("player " + data.player + "left")
})

socket.on("disconnect", (reason)=>{
    console.log("socket disconnected:", reason)
    document.getElementById("fullscreenBlock").style.display = "block"
})




function startGame(){
    socket.emit("startGame")
}

function changeHandCards(method, card, position){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 1"
    if(method == "add"){
        if(position){
            handCards.splice(position-1, 0, card)
        } else {
            handCards.push(card)
        }
    } else if(method == "remove"){
        console.log("removeHandcard " + card)
        selectedCard = {
            card: undefined,
            source: undefined,
            nextCard: undefined,
            id: undefined,
            cardNumber: undefined
        }
        handCards.splice(card-1, 1)
    }
    renderHandCards(handCards)
}

function changeTradingHandCards(cardNumber, activeState){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 2"
    console.log("changeTradingHandCards: cardNumber: " + cardNumber + " activeState: " + activeState)
    tradeHandCards[cardNumber-1].active = activeState
    selectedCard = {
        card: undefined,
        source: undefined,
        nextCard: undefined,
        id: undefined,
        cardNumber: undefined
    }
    handCards = []
    tradeHandCards.forEach((thisCard)=>{
        if(thisCard.active == true){
            handCards.push(thisCard.card)
        }
    })
    renderHandCards(tradeHandCards)
}

function renderHandCards(handCardArray){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 3"
    let lastCardPosition
    if(handCards.length % 2 == 1){
        lastCardPosition = Math.floor(handCards.length / 2) * 30
    } else {
        lastCardPosition = ((handCards.length / 2) - 1)*30 + 15
    }
    let renderedCards = ""
    let cardPosition = lastCardPosition
    handCardArray.reverse()
    let handCardNumber = handCardArray.length
    handCardArray.forEach((thisHandCard)=>{
        if(handCardArray[0].card){
            if(thisHandCard.active == true){
                renderedCards = renderedCards + "<img src='./pics/" + cards.find((card)=>{return card.id == thisHandCard.card}).image + "' id='handCardNumber" + handCardNumber + "' class='handCard card highlightOnHover' style='left:" + cardPosition + "px'></img>"
                cardPosition -= 30
            }
        } else {
            renderedCards = renderedCards + "<img src='./pics/" + cards.find((card)=>{return card.id == thisHandCard}).image + "' id='handCardNumber" + handCardNumber + "' class='handCard card highlightOnHover' style='left:" + cardPosition + "px'></img>"
                cardPosition -= 30
        }
        handCardNumber -= 1
    })
    handCardArray.reverse()
    document.getElementById("handcardContainer").innerHTML = renderedCards
    if(currentTrade.players[0].id == myPlayerID || currentTrade.players[1].id == myPlayerID){
        const handCardList = document.getElementsByClassName("handCard")
        for(let i = 0; i < handCardList.length; i++){
            handCardList[i].classList.add("pointer")
            handCardList[i].setAttribute("onclick", "selectCard(this.id, 'handCard', " + parseFloat(handCardList[i].id.slice(14)) + ")")
        }
    }
}

function changeOwnAcres(acre, harvest){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 4"
    console.log("changeAcres aufgerufen", acre)
    if(selectedCard.card == undefined || harvest == true){
        if(ownacres[acre-1].type){
            if(ownacres[acre-1].momentaryGain == "acre"){
                socket.emit("addDeck", {"cardType": ownacres[acre-1].type, "count": 2})
                buyThirdAcre(true)
            } else {
                socket.emit("addDeck", {"cardType": ownacres[acre-1].type, "count": ownacres[acre-1].count-ownacres[acre-1].momentaryGain})
                coins += ownacres[acre-1].momentaryGain
                socket.emit("changeCoins", {"coins": coins})
                if(coins > 0){
                    document.getElementById("coinSlot").style.display = "block"
                }
            }
            console.log("coins: " + coins)
            ownacres[acre-1].momentaryGain = 0
            ownacres[acre-1].type = undefined
            ownacres[acre-1].count = 0
            if(harvest == true){
                changeOwnAcres(acre)
            } else {
                renderAcres(acre)
            }
        }
    } else if(selectedCard.card){
        console.log("selected Card vorhanden")
        console.log("Ackertyp: ", ownacres[acre-1].type, "selected Card: ", selectedCard)
        if(ownacres[acre-1].type == selectedCard.card || ownacres[acre-1].type == undefined){
            ownacres[acre-1].type = selectedCard.card
            ownacres[acre-1].count += 1
            console.log(ownacres[acre-1].type)
            if(ownacres[acre-1].type == 1){
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[0]){ownacres[acre-1].momentaryGain = "acre"} //------------------------3.Acker
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[1]){ownacres[acre-1].momentaryGain = 3}
            } else if(ownacres[acre-1].type == 2){
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[0]){ownacres[acre-1].momentaryGain = 1}
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[1]){ownacres[acre-1].momentaryGain = 3}
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[2]){ownacres[acre-1].momentaryGain = 4}
            } else if(ownacres[acre-1].type == 3){
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[0]){ownacres[acre-1].momentaryGain = 2}
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[1]){ownacres[acre-1].momentaryGain = 3}
            } else {
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[0]){ownacres[acre-1].momentaryGain = 1}
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[1]){ownacres[acre-1].momentaryGain = 2}
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[2]){ownacres[acre-1].momentaryGain = 3}
                if(ownacres[acre-1].count >= cards.find((card)=>{return card.id == ownacres[acre-1].type}).gains[3]){ownacres[acre-1].momentaryGain = 4}
            }
            renderAcres(acre)

            if(selectedCard.source == "handCard"){
                const nextCard = selectedCard.nextCard
                changeHandCards("remove", 1)
                if(nextCard == true){
                    document.getElementById("revealCards").style.display = "block"
                    const handCardList = document.getElementsByClassName("handCard")
                    selectCard(handCardList[handCardList.length-1].id, "handCard")
                    selectedCard.nextCard = false
                } else {
                    revealCards()
                }
            } else if(selectedCard.source == 1){
                selectCard(selectedCard.id, 1)
                openCardsLeft -= 1
                socket.emit("centerCardRemove", {"card": "Left"})
                if(openCardsLeft == 0 && tradedCardsToPlant.length == 0){document.getElementById("endMove").style.display = "block"}
            } else if(selectedCard.source == 2){
                selectCard(selectedCard.id, 2)
                openCardsLeft -= 1
                socket.emit("centerCardRemove", {"card": "Right"})
                if(openCardsLeft == 0 && tradedCardsToPlant.length == 0){document.getElementById("endMove").style.display = "block"}
            } else if(selectedCard.source == "tradedCard"){
                let thisCardNumber = selectedCard.cardNumber
                selectCard(selectedCard.id, "tradedCard")
                removeTradedCard(thisCardNumber)
            }
        } else {
            changeOwnAcres(acre, true)
        }
    }
}

function renderAcres(acre){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 5"
    socket.emit("changeAcre", {"ownacres": ownacres})
    let renderedCards = "<img src='./pics/acre" + acre + ".png' id='acrePic" + acre + "' class='card' style='width:150px;left:-23px;'>"
    let cardPosition = 60
    for(let i = 0; i<ownacres[acre-1].count; i++){
        renderedCards = renderedCards + "<img src='./pics/" + cards.find((card)=>{return card.id == ownacres[acre-1].type}).image + "' class='card' style='top:" + cardPosition + "px'></img>"
        cardPosition += 15
    }
    console.log(renderedCards)
    document.getElementById("ownAcreCenter" + acre + "").innerHTML = renderedCards
}

function cursorOnAcre(acre, over){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 6"
    if(over == false || (selectedCard.card == undefined && ownacres[acre-1].type == undefined)){
        document.getElementById("acrePic" + acre).style.boxShadow = "0px 0px 0px 0px rgba(255, 217, 0, 0.6)"
    } else if(over == true && (selectedCard.card != undefined && (cards.find((card)=>{return card.id == selectedCard.card}).id == ownacres[acre-1].type || ownacres[acre-1].type == undefined))){
        document.getElementById("acrePic" + acre).style.boxShadow = "0px 0px 10px 7px rgba(255, 217, 0, 0.6)"
    } else if(over == true && (selectedCard.card == undefined || cards.find((card)=>{return card.id == selectedCard.card}).id != ownacres[acre-1].type)){
        document.getElementById("acrePic" + acre).style.boxShadow = "0px 0px 10px 7px rgba(200, 0, 0, 0.6)"
    }
    if(over == true && ownacres[acre-1].type != undefined){
        console.log("Acker " + acre + ": " + ownacres[acre-1].count + "x " + ownacres[acre-1].type + " -- Jetzt abbauen bringt " + ownacres[acre-1].momentaryGain + " Coins")//------------------------------------------------------
    }
}

function revealCards(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 7"
    document.getElementById("revealCards").style.display = "none"
    if(selectedCard.card){
        console.log("revealCards + nextCard == true")
        selectCard(selectedCard.id, "handCard")
    } else {
        selectedCard = {
            card: undefined,
            source: undefined,
            nextCard: undefined,
            id: undefined
        }
    }

    socket.emit("revealCards")
}

function selectCard(id, cardSource, cardNumber){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 8"
    console.log("selectCard mit id:" + id + " cardSource:" + cardSource + " cardNumber:" + cardNumber)
    if(selectedCard.card){
        console.log("gab schon karte")
        document.getElementById(selectedCard.id).classList.remove("selectedCard")
        document.getElementById(selectedCard.id).classList.add("highlightOnHover")
        if(selectedCard.id == id){
            console.log("karte war gleich")
            selectedCard = {
                card: undefined,
                source: undefined,
                nextCard: undefined,
                id: undefined,
                cardNumber: undefined
            }
        } else {
            console.log("andere karte")
            selectedCard = {
                card: undefined,
                source: cardSource,
                nextCard: false,
                id: id,
                cardNumber: cardNumber
            }
            const imageSource = document.getElementById(id).src
            cards.forEach((thisCard)=>{
                const matches = imageSource.match(thisCard.image)
                if(matches != null){
                    console.log("gefundene Karte: " + thisCard.id)
                    selectedCard.card = thisCard.id
                }
            })
            document.getElementById(selectedCard.id).classList.remove("highlightOnHover")
            document.getElementById(selectedCard.id).classList.add("selectedCard")
        }
    } else {
        console.log("gab keine Karte")
        selectedCard = {
            card: undefined,
            source: cardSource,
            nextCard: false,
            id: id,
            cardNumber: cardNumber
        }
        const imageSource = document.getElementById(id).src
        cards.forEach((thisCard)=>{
            const matches = imageSource.match(thisCard.image)
            if(matches != null){
                console.log("gefundene Karte: " + thisCard.id)
                selectedCard.card = thisCard.id
            }
        })
        document.getElementById(selectedCard.id).classList.remove("highlightOnHover")
        document.getElementById(selectedCard.id).classList.add("selectedCard")

        if(currentTrade.players[0].id == myPlayerID || currentTrade.players[1].id == myPlayerID){
            addTradingCard()
        }
    }
    console.log(selectedCard)
}

function addTradingCard(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 9"
    tradingCards.push({
        card: selectedCard.card,
        source: selectedCard.source,
        cardNumber: selectedCard.cardNumber
    })
    console.log(tradingCards)

    switch (selectedCard.source){
        case "handCard":
            console.log("Handkarte entfernen")
            changeTradingHandCards(selectedCard.cardNumber, false)
            break
        case 1:
            console.log("linke karte entfernen")
            selectCard(selectedCard.id, 1)
            openCardsLeft -= 1
            socket.emit("centerCardRemove", {"card": "Left"})
            break
        case 2:
            console.log("rechte karte entfernen")
            selectCard(selectedCard.id, 2)
            openCardsLeft -= 1
            socket.emit("centerCardRemove", {"card": "Right"})
            break
    }
    socket.emit("modifyTradingCards", {"cards":tradingCards, "player":myPlayerID})

}

function endMove(){
    socket.emit("endMove")
}

function requestTrade(button){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 10"
    let forPlayer
    if(turn == myPlayerID){
        button.classList.add("tradeRequestPending")
        button.innerHTML = "<h3>Ausstehend</h3>"
        button.setAttribute("onclick","")
        forPlayer = button.id.slice(18)
    } else {
        document.getElementById("tradeRequest").classList.add("tradeRequestPending")
        document.getElementById("tradeRequest").innerHTML = "<h2>Ausstehend</h2>"
        document.getElementById("tradeRequest").setAttribute("onclick","")
        forPlayer = turn
    }

    socket.emit("sendTradeRequest", {"fromPlayer":myPlayerID, "forPlayer":forPlayer})
}

function acceptTrade(requestFrom){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 11"
    console.log("trade accepted: von " + requestFrom)
    if(currentTrade.players[0].id){
        //a trade is active
        console.log("current Trade is still active")
    } else {
        // no active Trade
        socket.emit("acceptTrade", {"fromPlayer": requestFrom, "forPlayer": myPlayerID})
    }
}

function tradingButton(tradeAccepted){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 12"
    if(tradeAccepted == true){
        console.log("tradeAccepted == true")
        if(!document.getElementById("tradingAccept").classList.contains("tradingAcceptActive")){
            console.log("noch nicht accepted")
            currentTrade.players[currentTrade.players.findIndex((thisPlayer)=>{return thisPlayer.id == myPlayerID})].accepted = true
            document.getElementById("tradingAccept").classList.add("tradingAcceptActive")
            document.getElementById("tradingAccept").innerHTML = "<h3>Akzeptiert</h3>"
            socket.emit("editCurrentTrade", {"currentTrade": currentTrade})
        } else {
            currentTrade.players[currentTrade.players.findIndex((thisPlayer)=>{return thisPlayer.id == myPlayerID})].accepted = false
            document.getElementById("tradingAccept").classList.remove("tradingAcceptActive")
            document.getElementById("tradingAccept").innerHTML = "<h3>Akzeptieren</h3>"
            socket.emit("editCurrentTrade", {"currentTrade": currentTrade})
        }
    } else {
        //decline Trade
        declineTrade()
    }
}

function declineTrade(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 13"
    //removeTradingCard(true)
    socket.emit("declineTrade")
}

function removeTradingCard(all, cardNumber){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 14"
    if(all == true){
        console.log("tradingCardLength: " + tradingCards.length)
        /*centerCardAdd1 = false
        centerCardAdd2 = false*/
        for(let i = 0; i<tradingCards.length; i++){
            console.log("card removal started")
            if(tradingCards[i].source == "handCard"){
                changeTradingHandCards(tradingCards[i].cardNumber, true)
            } else if(tradingCards[i].source == 1){
                socket.emit("centerCardAdd", {"card": 1})
                openCardsLeft++
            } else if(tradingCards[i].source == 2){
                socket.emit("centerCardAdd", {"card": 2})
                openCardsLeft++
            }
            console.log("card removed")
        }
       tradingCards = []
    } else {
        thisCard = tradingCards[cardNumber]
        console.log(thisCard)
        if(thisCard.source == "handCard"){
            changeTradingHandCards(thisCard.cardNumber, true)
        } else if(thisCard.source == 1){
            socket.emit("centerCardAdd", {"card": 1})
            openCardsLeft++
        } else if(thisCard.source == 2){
            socket.emit("centerCardAdd", {"card": 2})
            openCardsLeft++
        }
        tradingCards.splice(cardNumber, 1)
        socket.emit("modifyTradingCards", {"cards":tradingCards, "player":myPlayerID})
    }    
}

function renderTradedCardsToPlant(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 15"
    let initPosition = (100 / tradedCardsToPlant.length) / 2 - 50
    let renderedCards = ""
    tradedCardsToPlant.forEach((card, index)=>{
        let cardPosition = initPosition + (100 / tradedCardsToPlant.length)*index
        renderedCards += "<img src='./pics/" + cards.find((thisCard)=>{return thisCard.id == card}).image + "' id='tradedCardNumber" + (index+1) + "' class='card highlightOnHover tradedCard pointer' style='left:" + cardPosition + "%;top:-130px'></img>"
    })
    document.getElementById("tradedCards").innerHTML = renderedCards
    tradedCardList = document.getElementsByClassName("tradedCard")
    for(let i = 0; i < tradedCardList.length; i++){
        tradedCardList[i].setAttribute("onclick", "selectCard(this.id, 'tradedCard', " + (i+1) + ")")
    }
}

function removeTradedCard(cardNumber){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 16"
    tradedCardsToPlant.splice(cardNumber-1, 1)
    renderTradedCardsToPlant()
    if(tradedCardsToPlant.length < 1){
        tradedCardsToPlant = []
        closeTradingMenu()
    }
}


function buyThirdAcre(free){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 17"
    if(free == true){
        document.getElementById("buyThirdAcreDiv").style.display = "none"
        document.getElementById("ownAcre3").style.display = "block"
        ownacres[2].locked = false
        socket.emit("changeAcre", {"ownacres": ownacres})
        document.getElementById("ownAcreCount").innerHTML = " - 3 - "
    } else {
        if(coins >= 3){
            document.getElementById("buyThirdAcreDiv").style.display = "none"
            document.getElementById("ownAcre3").style.display = "block"
            ownacres[2].locked = false
            socket.emit("changeAcre", {"ownacres": ownacres})
            document.getElementById("ownAcreCount").innerHTML = " - 3 - "
            coins -= 3;
            socket.emit("changeCoins", {"coins": coins})
        }
        if(coins == 0){
            document.getElementById("coinSlot").style.display = "none"
        }
    }
}

function cursorOnAcreBuyButton(over){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 18"
    if(over == true && coins >= 3){
        document.getElementById("buyThirdAcre").style.boxShadow = "0px 0px 10px 7px rgba(215, 215, 0, 0.6)"
    } else if(over == true && coins < 3){
        document.getElementById("buyThirdAcre").style.boxShadow = "0px 0px 10px 7px rgba(200, 0, 0, 0.6)"
    } else if(over == false){
        document.getElementById("buyThirdAcre").style.boxShadow = "0px 0px 0px 0px rgba(0, 0, 0, 0)"
    }
}

function cursorOnCoin(over){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 19"
    document.getElementById("coinNumber").innerHTML = "<h2>" + coins + " Münzen</h2>"
    if(over == true){
        document.getElementById("coinNumber").style.display = "block"
    } else {
        document.getElementById("coinNumber").style.display = "none"
    }
}

function renderForeignAcres(acre){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 20"
    if(acre == 3){
        document.getElementById("foreignAcre3").style.display = "block"
    } else {
        document.getElementById("foreignAcre3").style.display = "none"
    }
    let renderedCards = "<img src='./pics/acre" + acre + ".png' id='acrePic" + acre + "' class='card' style='width:150px;left:-23px;'>"
    let cardPosition = 60
    thisAcre = foreignAcres.find((thisForeignAcre)=>{return thisForeignAcre.player == currentlyShownAcre})
    for(let i = 0; i<thisAcre.acres[acre-1].count; i++){
        renderedCards = renderedCards + "<img src='./pics/" + cards.find((card)=>{return card.id == thisAcre.acres[acre-1].type}).image + "' class='card' style='top:" + cardPosition + "px'></img>"
        cardPosition += 15
    }
    console.log(renderedCards)
    document.getElementById("foreignAcreCenter" + acre + "").innerHTML = renderedCards
}

function selectNextAcre(){
    document.getElementById("lastExecution").innerHTML = document.getElementById("lastExecution").innerHTML + " - 21"
    let filteredPlayers = currentPlayers.filter((thisPlayer)=>{
        return thisPlayer.id != myPlayerID
    })
    console.log(filteredPlayers)
    let playerNumber = filteredPlayers.findIndex((thisFilteredPlayer)=>{return thisFilteredPlayer.id == currentlyShownAcre})
    console.log(playerNumber)
    if(filteredPlayers.length <= playerNumber+1){
        console.log("1")
        currentlyShownAcre = filteredPlayers[0].id
    } else {
        console.log("2")
        currentlyShownAcre = filteredPlayers[playerNumber+1].id
    }
    console.log(currentlyShownAcre)
    document.getElementById("foreignAcreName").innerHTML = " - " + currentPlayers.find((thisCurrentPlayer)=>{return thisCurrentPlayer.id == currentlyShownAcre}).username + " - "
    renderForeignAcres(1)
    renderForeignAcres(2)
    if(foreignAcres.find((thisForeignAcre)=>{return thisForeignAcre.player == currentlyShownAcre}).acres[2].locked == false){
        renderForeignAcres(3)
    }
}