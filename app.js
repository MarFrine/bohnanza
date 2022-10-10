const express = require("express")
const socket = require("socket.io")
const fs = require("fs")

const app = express()
const port = process.env.PORT || 8080
const server = app.listen(port, (req, res)=>{
    console.log("Server on port: " + port)
})
app.use(express.static("./public"))
app.use(express.urlencoded({ extended:false }))
app.use(express.json())

const io = socket(server)

fs.readFile("./deck.json", "utf8", (error, data)=>{
    if (error){
        console.log("error")
    } else {
        return cards = JSON.parse(data)
    }
})

let currentReset = false
let deck = []
let shuffles = 0
let oldDeck = []
let playerCount = 0
let players = []
let activePlayers = []
let currentTrade = {
    players: [{
        id: undefined,
        cards: [],
        firstRequest: undefined, //ob dieser Spieler den Trade requested hat (wenn nicht hat er ihn angenommen)
        accepted: false
        },{
        id: undefined,
        cards: [],
        firstRequest: undefined,
        accepted: false
    }]
}
let gameState = {
    active: false,
    state: "pre-game", 
    stateFinished: 0, //wie viele den state abgeschlossen haben
    tradeOffers: [],
    currentTrade: [],
    turn: undefined, // wer dran ist(playerID)
    openCards: []
}
class Player {
    constructor(newID){
        this.username = undefined
        this.id = newID
        this.turn = false //wenn man am Zug ist
        this.handCards = []
        this.activeTrade = false
        this.occupied = false // wenn der Spieler nach dem Zug noch Karten aunabuen muss
        this.coins = 0
        this.acres = [
            {
                type: undefined,
                count: 0,
                locked: false
            },
            {
                type: undefined,
                count: 0,
                locked: false
            },
            {
                type: undefined,
                count: 0,
                locked: true
            }
        ]
        players.push(this)
        activePlayers.push(this)
        playerCount++
    }
    disconnect(reason){
        activePlayers = activePlayers.filter((player)=>{return player.id != this.id})
        playerCount -= 1
        console.log(this.username + "(" + this.id + ") disconnected: " + reason + "  --  " + playerCount + " players left")
    }
}

app.get("/reset", (req, res)=>{
    reset()
    res.status(200)
})

function reset(){
    setTimeout(()=>{currentReset = false}, 500)
    currentReset = true
    io.emit("reset")

    deck = []
    shuffles = 0
    oldDeck = []
    playerCount = 0
    players = []
    activePlayers = []
    currentTrade = {
        players: [{
            id: undefined,
            cards: [],
            firstRequest: undefined, //ob dieser Spieler den Trade requested hat (wenn nicht hat er ihn angenommen)
            accepted: false
            },{
            id: undefined,
            cards: [],
            firstRequest: undefined,
            accepted: false
        }]
    }
    gameState = {
        active: false,
        state: "pre-game", 
        stateFinished: 0, //wie viele den state abgeschlossen haben
        tradeOffers: [],
        currentTrade: [],
        turn: undefined, // wer dran ist(playerID)
        openCards: []
    }
}

function shuffleCards(newDeck){
    if(shuffles < 2){
        shuffles++
        if(newDeck == cards) {
            for(let i = 0; i < cards.length; i++) { //creates full, sorted deck
                for(let j = 0; j < cards[i].count; j++){
                    deck.push(i+1)
                }
            }
            deck.sort(() => Math.random() - 0.5); // shuffles deck
            deck.sort(() => Math.random() - 0.5); // shuffles deck
            deck.sort(() => Math.random() - 0.5); // shuffles deck
            deck.sort(() => Math.random() - 0.5); // shuffles deck  -------- mehrfach damit es besser gemischt wird
        } else {
            newDeck.sort(() => Math.random() - 0.5);
            newDeck.sort(() => Math.random() - 0.5);
            newDeck.sort(() => Math.random() - 0.5);
            newDeck.sort(() => Math.random() - 0.5);
            deck = [...deck, ...newDeck]
        }
        oldDeck = []
        console.log(deck)
    } else {
        gameFinished()
    }
    
}

io.on("connection", (socket)=>{
    if(gameState.active == false && playerCount <= 7){
        const newPlayer = new Player(socket.id)
        console.log("socket connected:", socket.id)
    } else if(gameState.active == true){
        console.log("socket connect rejected - game is active")
        socket.disconnect()
    } else if(playerCount > 7){
        console.log("socket connect rejected - game is full")
        socket.disconnect("reason")
    }

    socket.on("rejoin", ()=>{
        socket.disconnect()
        console.log("socket " + socket.id + " disconnected")
    })

    socket.on("getUsername", (username, callback)=>{
        let usernameState
        if(activePlayers.find((player)=>{return player.username == username})){
            usernameState = "reject"
        } else {
            usernameState = "accepted"
            activePlayers.find((player)=>{return player.id == socket.id}).username = username
            io.emit("playerList", activePlayers)
        }
        callback({
            status: usernameState
        })
    })

    socket.on("startGame", ()=>{
        if(activePlayers.length < 2){
            console.log("zu wenig spieler")
            return
        }
        shuffleCards(cards)
        activePlayers.forEach((player)=>{
            player.handCards.push(deck.shift(), deck.shift(), deck.shift(), deck.shift(), deck.shift())
        })
    
        let randomPlayer = Math.floor(Math.random()*playerCount)
        activePlayers[randomPlayer].turn = true
        gameState.turn = activePlayers[randomPlayer].id
        //console.log(activePlayers)
        //console.log(gameState.turn)
    
        gameState.active = true
        io.emit("playerList", activePlayers)
        activePlayers.forEach((player)=>{
            io.to(player.id).emit("startGame", {"cards": cards, "handCards": player.handCards})
        })
        io.emit("move_1", {"turn": gameState.turn})
    })

    socket.on("addDeck", (data)=>{
        const newCardType = data.cardType
        const newCardCount = data.count
        console.log(newCardType, newCardCount)
        for(let i = 0; i < newCardCount; i++){
            oldDeck.push(newCardType)
        }
        console.log(oldDeck)
    })

    socket.on("revealCards", ()=>{
        const openCards = [deck.shift(), deck.shift()]
        io.emit("move_2", {"cards": openCards})
    })

    socket.on("centerCardRemove", (data)=>{
        io.emit("centerCardRemove", {"card": data.card})
    })

    socket.on("centerCardAdd", (data)=>{
        io.emit("centerCardAdd", {"card": data.card})
    })

    socket.on("sendTradeRequest", (data)=>{
        console.log("Von: " + data.fromPlayer + ", für: " + data.forPlayer)
        io.to(data.forPlayer).emit("sendTradeRequest", {"fromPlayer": data.fromPlayer})
    })

    socket.on("changeMyStatus", (data)=>{
        activePlayers.find((thisActivePlayer)=>{
            return thisActivePlayer.id == data.player
        }).occupied = data.newOccupiedStatus
        socket.emit("tradeCompleted")
        console.log("status changed from " + data.player)
    })

    socket.on("acceptTrade", (data)=>{
        
        if((activePlayers.find((thisActivePlayer)=>{return thisActivePlayer.id == data.fromPlayer}).occupied == true) || (activePlayers.find((thisActivePlayer)=>{return thisActivePlayer.id == data.forPlayer}).occupied == true)){
            console.log("one player is occupied")
        } else {
            currentTrade = {
                players: [{
                    id: data.fromPlayer,
                    cards: [],
                    accepted: false
                    },{
                    id: data.forPlayer,
                    cards: [],
                    accepted: false
                }]
            }
            console.log("trade:", currentTrade)

            activePlayers.forEach((thisPlayer)=>{
                if(thisPlayer.id == currentTrade.players[0].id || thisPlayer.id == currentTrade.players[1].id){
                    console.log("spieler beteiligt")
                    io.to(thisPlayer.id).emit("startTrade", {"trade": currentTrade})
                } else {
                    io.to(thisPlayer.id).emit("startTrade", {"trade": {players:[{id: data.fromPlayer},{id: data.forPlayer}]}})
                }
            })
        }
    })

    socket.on("joinRoom", ()=>{
        socket.join("trade")
    })
    
    socket.on("leaveRoom", ()=>{
        socket.leave("trade")
    })

    socket.on("modifyTradingCards", (data)=>{
        currentTrade.players[currentTrade.players.findIndex((thisPlayer)=>{return thisPlayer.id == data.player})].cards = data.cards
        console.log(currentTrade)
        currentTrade.players[0].accepted = false
        currentTrade.players[1].accepted = false
        io.to("trade").emit("editCurrentTrade", {"currentTrade": currentTrade})
        io.to("trade").emit("modifyTradingCards", {"cards": data.cards, "player": data.player})
    })

    socket.on("editCurrentTrade", (data)=>{
        currentTrade = data.currentTrade
        io.to("trade").emit("editCurrentTrade", {"currentTrade": currentTrade})
        if(currentTrade.players[0].accepted == true && currentTrade.players[1].accepted == true){
            console.log("beide akzeptiert")
            io.to("trade").emit("tradeFinished", {"currentTrade": currentTrade})
            io.emit("tradeCompleted")
            currentTrade.players.forEach((thisPlayer)=>{
                activePlayers.find((thisActivePlayer)=>{return thisActivePlayer.id == thisPlayer.id}).occupied = true
            })
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
        }
    })

    socket.on("declineTrade", ()=>{
        io.to("trade").emit("declineTrade")
        io.emit("tradeCompleted")
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
    })

    socket.on("changeAcre", (data)=>{
        thisPlayer = activePlayers.find((thisActivePlayer)=>{return thisActivePlayer.id == socket.id})
        thisPlayer.acres = [
            {
                type: data.ownacres[0].type,
                count: data.ownacres[0].count,
                locked: data.ownacres[0].locked
            },
            {
                type: data.ownacres[1].type,
                count: data.ownacres[1].count,
                locked: data.ownacres[1].locked
            },
            {
                type: data.ownacres[2].type,
                count: data.ownacres[2].count,
                locked: data.ownacres[2].locked
            }
        ]
        console.log("acre changed:", thisPlayer)
        socket.broadcast.emit("changeAcre", {"player": thisPlayer.id, "acres": thisPlayer.acres})
    })

    socket.on("changeCoins", (data)=>{
        activePlayers.find((thisActivePlayer)=>{return thisActivePlayer.id == socket.id}).coins = data.coins
    })
    

    socket.on("endMove", ()=>{
        socket.emit("endMoveCards", {"cards": [deck.shift(), deck.shift(), deck.shift()]})
        if(deck.length <= 4){
            shuffleCards(oldDeck)
        }
        io.emit("endMove")
        let newTurn = activePlayers.indexOf(activePlayers.find((player)=>{return player.id == gameState.turn}))+1
        if(newTurn >= activePlayers.length){newTurn = 0}
        gameState.turn = activePlayers[newTurn].id
        let occupiedPlayers = activePlayers.filter((thisActivePlayer)=>{
            return thisActivePlayer.occupied == true
        })
        for(let i = 0; i < occupiedPlayers.length; i++){
            occupiedPlayers[i] = occupiedPlayers[i].id
        }
        console.log("occupied Players:", occupiedPlayers)
        io.emit("move_1", {"turn": gameState.turn, "occupiedPlayers": occupiedPlayers})
    })

    socket.on("disconnect", (reason)=>{
        if(currentReset == true){
            return
        }
        activePlayers.find((player)=>{return player.id == socket.id}).disconnect(reason)
        io.emit("stopGame", {"player": socket.id})
    })
})

function gameFinished(){

    io.emit("gameFinished", {"players": activePlayers})
}