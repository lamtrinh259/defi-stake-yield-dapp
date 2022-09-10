import { useEffect, useState } from "react"
import { useContractFunction, useEthers } from "@usedapp/core"
import TokenFarm from "../chain-info/contracts/TokenFarm.json"
import ERC20 from "../chain-info/contracts/MockERC20.json"
import networkMapping from "../chain-info/deployments/map.json"
import { Contract } from "@ethersproject/contracts"
import { constants, utils } from "ethers"


/**
 * This hook is a bit messy but exposes a 'send' which makes two transactions.
 * The first transaction is to approve the ERC-20 token transfer on the token's contract.
 * Upon successful approval, a second transaction is initiated to execute the transfer by the TokenFarm contract.
 * The 'state' returned by this hook is the state of the first transaction until that has status "Succeeded".
 * After that it is the state of the second transaction.
 * @param tokenAddress - The token address of the token we wish to stake
 */
export const useStakeTokens = (tokenAddress: string) => {
    const { chainId } = useEthers()
    const { abi } = TokenFarm
    const tokenFarmContractAddress = chainId ? networkMapping[String(chainId)]["TokenFarm"][0] : constants.AddressZero

    const tokenFarmInterface = new utils.Interface(abi)

    const tokenFarmContract = new Contract(
        tokenFarmContractAddress,
        tokenFarmInterface
    )

    const { send: stakeTokensSend, state: stakeTokensState } =
        useContractFunction(tokenFarmContract, "stakeTokens", {
            transactionName: "Stake tokens",
        })

    const erc20Interface = new utils.Interface(ERC20.abi)

    const tokenContract = new Contract(tokenAddress, erc20Interface)

    const { send: approveErc20Send, state: approveErc20State } =
        useContractFunction(tokenContract, "approve", {
            transactionName: "Approve ERC20 transfer",
        })

    const [amountToStake, setAmountToStake] = useState("0")

    useEffect(() => {
        if (approveErc20State.status === "Success") {
            stakeTokensSend(amountToStake, tokenAddress)
        }
        // the dependency arry
        // the code inside the useEffect anytime
        // anything in this list changes
        // if you want something to run when the component first runs
        // you just have a blank list
    }, [approveErc20State, amountToStake, tokenAddress]) // eslint-disable-line react-hooks/exhaustive-deps

    const send = (amount: string) => {
        setAmountToStake(amount)
        return approveErc20Send(tokenFarmContractAddress, amount)
    }

    const [state, setState] = useState(approveErc20State)

    useEffect(() => {
        if (approveErc20State.status === "Success") {
            setState(stakeTokensState)
        } else {
            setState(approveErc20State)
        }
    }, [approveErc20State, stakeTokensState])

    return { send, state }
}

// export const useStakeTokens = (tokenAddress: string) => {
//     // address
//     // abi
//     // chainId
//     const { chainId } = useEthers()
//     const { abi } = TokenFarm
//     const tokenFarmAddress = chainId ? networkMapping[String(chainId)]["TokenFarm"][0] : constants.AddressZero
//     const tokenFarmInterface = new utils.Interface(abi)
//     const tokenFarmContract = new Contract(tokenFarmAddress, tokenFarmInterface)
//     const erc20ABI = ERC20.abi
//     const erc20Interface = new utils.Interface(erc20ABI)
//     const erc20Contract = new Contract(tokenAddress, erc20Interface)

//     // approve


//     // stake tokens
//     const { send: approveErc20Send, state: approveErc20State } = useContractFunction(erc20Contract, "approve", { transactionName: "Approve ERC20 transfer" })
//     const approveAndStake = (amount: string) => {
//         setAmountToStake(amount)
//         return approveErc20Send(tokenFarmAddress, amount)
//     }
//     const [amountToStake, setAmountToStake] = useState("0")

//     const { send: stakeSend, state: approveAndStakeErc20State } = useContractFunction(tokenFarmContract, "stakeTokens", { transactionName: "Stake Tokens" })
//     useEffect(() => {
//         if (approveErc20State.status === 'Success') {
//             stakeSend(amountToStake, tokenAddress)
//         }
//     }, [approveAndStakeErc20State, amountToStake, tokenAddress])

//     const [state, setStake] = useState(approveAndStakeErc20State)
//     useEffect(() => {
//         if (approveAndStakeErc20State.status === "Success") {
//             approveAndStakeErc20State(setStake)
//         } else {
//             approveAndStakeErc20State(approveAndStakeErc20State)
//         }
//     }, [approveAndStakeErc20State, setStake])

//     return { approveAndStake, state }
// }