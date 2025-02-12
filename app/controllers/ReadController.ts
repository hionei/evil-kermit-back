import { GraphQLClient } from "graphql-request";
import { Request, Response, query } from "express";
import { getWeb3, getWeb3Contract } from "../services/web3";
import dotenv from "dotenv";
import { currentUnixTime } from "../utils/helpers";
import Users from "../models/users";
dotenv.config();

class ReadController {
  web3!: any;

  constructor() {
    this.web3 = getWeb3;
    this.listenEvent();
  }

  listenEvent = async () => {
    this.web3 = getWeb3();
    const addr = "0x07FD831798764025060ac0741E44663BbF9cD54E";

    const presaleContract = await getWeb3Contract(this.web3, addr, "presale");
    const boughtEvent = presaleContract.events.TokensBought();

    boughtEvent.on("data", async (event) => {
      console.log(
        `New Purchase: ${event.returnValues.user} bought ${event.returnValues.tokensBought} tokens in phase ${event.returnValues.currentStep}`
      );

      await Users.findOneAndUpdate(
        {
          address: event.returnValues.user,
          phase: Number(event.returnValues.currentStep),
        },
        {
          $inc: { amount: Number(event.returnValues.tokensBought) },
        },
        { upsert: true, new: true }
      );
    });
  };

  getPastEvents = async (req: Request, res: Response) => {
    this.web3 = getWeb3();
    const addr = "0x3f7bF2CA46693B6c0a461a117688cDAf2cee6B31";

    const presaleContract = await getWeb3Contract(this.web3, addr, "presale");
    const latestBlock = await this.web3.eth.getBlockNumber();

    const events = await presaleContract.getPastEvents("TokensBought", {
      fromBlock: Number(latestBlock) - 500,
      toBlock: "latest",
    });

    console.log("Recent Events:", events);

    return res.json({ result: [] });
  };

  getUsers = async (req: Request, res: Response) => {
    const users = await Users.find({});

    let returnArray = { 0: [], 1: [], 2: [], 3: [] };

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
