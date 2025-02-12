import { GraphQLClient } from "graphql-request";
import { Request, Response, query } from "express";
import { getWeb3, getWeb3Contract } from "../services/web3";
import dotenv from "dotenv";
import { currentUnixTime } from "../utils/helpers";
import Users from "../models/users";
import { selectionSetMatchesResult } from "@apollo/client/cache/inmemory/helpers";
dotenv.config();
const addr = "0x38bd08a1112E6b235116233Db74DDf8B5E8046F6";

class ReadController {
  web3!: any;
  lastBlock: number = 0;

  constructor() {
    this.web3 = getWeb3();
    // this.listenEvent();
    setInterval(() => {
      this.storePastBoughtEvents();
    }, 5000)
  }

  listenEvent = async () => {
    this.web3 = getWeb3();
    const presaleContract = await getWeb3Contract(this.web3, addr, "presale");

    try {
      presaleContract.events.allEvents().on("data", async (event, error) => {
        console.log(`🔥 New Event: ${event.event}`);
        if (error) {
          console.log(error)
        }
  
        if (event.event === "TokensBought") {
            console.log(
                `✅ New Purchase: ${event.returnValues.user} bought ${event.returnValues.tokensBought} tokens in phase ${event.returnValues.currentStep} transaction hash: ${event.transactionHash}`
            );
  
            await Users.findOneAndUpdate(
                {
                    address: event.returnValues.user,
                    phase: Number(event.returnValues.currentStep),
                    transactionHash: event.transactionHash
                },
                { $inc: { amount: Number(event.returnValues.tokensBought) } },
                { upsert: true, new: true }
            );
        }
      })

      presaleContract.events.allEvents().on("error", async (error) => {
        console.error("❌ WebSocket Error:", error);
        this.reconnectWebSocket();
      })
    } catch(err) {
      console.log(err)
    }
  };

  // ✅ Auto-Reconnect on Failure
  reconnectWebSocket = () => {
    console.log("🔄 Reconnecting WebSocket in 5 seconds...");
    setTimeout(async () => {
      await this.listenEvent();
    }, 2000);
  }

  storePastBoughtEvents = async () => {
    this.web3 = getWeb3();
    const presaleContract = await getWeb3Contract(this.web3, addr, "presale");
    const latestBlock = await this.web3.eth.getBlockNumber();

    const fromBlock = this.lastBlock ? this.lastBlock : Number(latestBlock) - 100;

    const events = await presaleContract.getPastEvents("TokensBought", {
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    this.lastBlock = latestBlock;

    events.forEach(async (event) => {
      const existingRecord = await Users.findOne({
        transactionHash: event.transactionHash
      });

      if (!existingRecord) {
        console.log(
          `✅ New Purchase: ${event.returnValues.user} bought ${event.returnValues.tokensBought} tokens in phase ${event.returnValues.currentStep} transaction hash: ${event.transactionHash}`
        );
        await Users.findOneAndUpdate(
          {
              address: event.returnValues.user,
              phase: Number(event.returnValues.currentStep),
              transactionHash: event.transactionHash
          },
          { 
            $inc: { amount: Number(event.returnValues.tokensBought) }, 
          },
          { upsert: true, new: true }
        );
      } else {
        console.log(`⚠️ Skipping update: Duplicate transaction detected (${event.transactionHash})`);
      }
    })

  };

  getPastEvents = async (req: Request, res: Response) => {
    this.web3 = getWeb3();

    const presaleContract = await getWeb3Contract(this.web3, addr, "presale");
    const latestBlock = await this.web3.eth.getBlockNumber();

    const events = await presaleContract.getPastEvents("TokensBought", {
      fromBlock: Number(latestBlock) - 5000,
      toBlock: "latest",
    });

    events.forEach(async (event) => {
      console.log(
        `✅ New Purchase: ${event.returnValues.user} bought ${event.returnValues.tokensBought} tokens in phase ${event.returnValues.currentStep}`
      );
      await Users.findOneAndUpdate(
        {
            address: event.returnValues.user,
            phase: Number(event.returnValues.currentStep),
            transactionHash: event.transactionHash
        },
        { $inc: { amount: Number(event.returnValues.tokensBought) } },
        { upsert: true, new: true }
      );
    })

    return res.json({ result: [] });
  };

  getUsers = async (req: Request, res: Response) => {
    const users = await Users.find({});

    let returnArray = [[],[],[],[]];

    users.map((user) => {
      returnArray[user.phase].push({
        address: user.address,
        amount: user.amount,
      });
    });
    return res.json({ result: returnArray });
  };
}

export default ReadController;
