import { useEffect, useState } from "react"
import { useContractFunction, useEthers } from "@usedapp/core"
import TokenFarm from "../chain-info/contracts/TokenFarm.json"
import ERC20 from "../chain-info/contracts/MockERC20.json"
import networkMapping from "../chain-info/deployments/map.json"
import { Contract } from "@ethersproject/contracts"
import { constants, utils } from "ethers"


export const useStakeTokens = (tokenAddress: string) => {
    // address
    // abi
    // chainId
    const { chainId } = useEthers()
    const { abi } = TokenFarm
    const tokenFarmAddress = chainId ? networkMapping[String(chainId)]["TokenFarm"][0] : constants.AddressZero
    const tokenFarmInterface = new utils.Interface(abi)
    const tokenFarmContract = new Contract(tokenFarmAddress, tokenFarmInterface)
    const erc20ABI = ERC20.abi
    const erc20Interface = new utils.Interface(erc20ABI)
    const erc20Contract = new Contract(tokenAddress, erc20Interface)

    // approve


    // stake tokens
    const { send: approveErc20Send, state: approveErc20State } = useContractFunction(erc20Contract, "approve", { transactionName: "Approve ERC20 transfer" })
    const approveAndStake = (amount: string) => {
        setAmountToStake(amount)
        return approveErc20Send(tokenFarmAddress, amount)
    }
    const [amountToStake, setAmountToStake] = useState("0")

    const { send: stakeSend, state: approveAndStakeErc20State } = useContractFunction(tokenFarmContract, "stakeTokens", { transactionName: "Stake Tokens" })
    useEffect(() => {
        if (approveErc20State.status === 'Success') {
            stakeSend(amountToStake, tokenAddress)
        }
    }, [approveAndStakeErc20State, amountToStake, tokenAddress])

    const [state, setSate] = useState(approveAndStakeErc20State)
    useEffect(() => {
        if (approveAndStakeErc20State.status === "Success") {
            approveAndStakeErc20State(stakeState)
        } else {
            approveAndStakeErc20State(approveAndStakeErc20State)
        }
    }, [approveAndStakeErc20State, stakeState])

    return { approveAndStake, state }
}