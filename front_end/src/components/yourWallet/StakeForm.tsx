import { Token } from "../Main"
import { useEthers, useTokenBalance, useNotifications } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import { SliderInput } from "../../components/SliderInput"
import { Button, Input, CircularProgress, Snackbar, makeStyles } from "@material-ui/core"
import React, { useEffect, useState } from 'react'
import Alert from "@material-ui/lab/Alert"
import { useStakeTokens } from "../../hooks/useStakeTokens"
import { utils } from "ethers"

export interface StakeFormProps {
    token: Token
}

const useStyles = makeStyles((theme) => ({
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.spacing(2),
        width: "100%",
    },
    slider: {
        width: "100%",
        maxWidth: "400px",
    }
}))

export const StakeForm = ({ token }: StakeFormProps) => {
    const { address: tokenAddress, name } = token

    const { account } = useEthers()
    const tokenBalance = useTokenBalance(tokenAddress, account)
    const { notifications } = useNotifications()

    const classes = useStyles()

    const { send: stakeTokensSend, state: stakeTokensState } =
        useStakeTokens(tokenAddress)

    const formattedTokenBalance: number = tokenBalance
        ? parseFloat(formatUnits(tokenBalance, 18))
        : 0

    const handleStakeSubmit = () => {
        const amountAsWei = utils.parseEther(amount.toString())
        return stakeTokensSend(amountAsWei.toString())
    }

    const [amount, setAmount] =
        useState<number | string | Array<number | string>>(0)

    const [showErc20ApprovalSuccess, setShowErc20ApprovalSuccess] =
        useState(false)
    const [showStakeTokensSuccess, setShowStakeTokensSuccess] = useState(false)

    const handleCloseSnack = () => {
        showErc20ApprovalSuccess && setShowErc20ApprovalSuccess(false)
        showStakeTokensSuccess && setShowStakeTokensSuccess(false)
    }

    useEffect(() => {
        if (
            notifications.filter(
                (notification) =>
                    notification.type === "transactionSucceed" &&
                    notification.transactionName === "Approve ERC20 transfer"
            ).length > 0
        ) {
            !showErc20ApprovalSuccess && setShowErc20ApprovalSuccess(true)
            showStakeTokensSuccess && setShowStakeTokensSuccess(false)
        }

        if (
            notifications.filter(
                (notification) =>
                    notification.type === "transactionSucceed" &&
                    notification.transactionName === "Stake tokens"
            ).length > 0
        ) {
            showErc20ApprovalSuccess && setShowErc20ApprovalSuccess(false)
            !showStakeTokensSuccess && setShowStakeTokensSuccess(true)
        }
    }, [notifications, showErc20ApprovalSuccess, showStakeTokensSuccess])

    const isMining = stakeTokensState.status === "Mining"

    const hasZeroBalance = formattedTokenBalance === 0
    const hasZeroAmountSelected = parseFloat(amount.toString()) === 0
    return (
        <>
            <div className={classes.container}>
                <SliderInput
                    label={`Stake ${name}`}
                    maxValue={formattedTokenBalance}
                    id={`slider-input-${name}`}
                    className={classes.slider}
                    value={amount}
                    onChange={setAmount}
                    disabled={isMining || hasZeroBalance}
                />
                <Button
                    color="primary"
                    variant="contained"
                    size="large"
                    onClick={handleStakeSubmit}
                    disabled={isMining || hasZeroAmountSelected}
                >
                    {isMining ? <CircularProgress size={26} /> : "Stake"}
                </Button>
            </div>
            <Snackbar
                open={showErc20ApprovalSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
            >
                <Alert onClose={handleCloseSnack} severity="success">
                    ERC-20 token transfer approved successfully! Now approve the 2nd tx to
                    initiate the staking transfer.
                </Alert>
            </Snackbar>
            <Snackbar
                open={showStakeTokensSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
            >
                <Alert onClose={handleCloseSnack} severity="success">
                    Tokens staked successfully!
                </Alert>
            </Snackbar>
        </>
    )
}
    // const { address: tokenAddress, name } = token
    // const { account } = useEthers()
    // const tokenBalance = useTokenBalance(tokenAddress, account)
    // const formattedTokenBalance: number = tokenBalance ? parseFloat(formatUnits(tokenBalance, 18)) : 0
    // const { notifications } = useNotifications()

    // const [amount, setAmount] = useState<number | string | Array<number | string>>(0)
    // const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const newAmount = event.target.value === "" ? "" : Number(event.target.value)
    //     setAmount(newAmount)
    //     console.log(newAmount) // logging new amount in console
    // }

    // const { approveAndStake, state: approveAndStakeErc20State } = useStakeTokens(tokenAddress)
    // const handleStakeSubmit = () => {
    //     const amountAsWei = utils.parseEther(amount.toString())
    //     return approveAndStake(amountAsWei.toString())
    // }

    // const isMining = approveAndStakeErc20State.status === "Mining"
    // const [showErc20ApprovalSuccess, setShowErc20ApprovalSuccess] = useState(false)
    // const [showStakeTokenSuccess, setShowStakeTokenSuccess] = useState(false)
    // const handleCloseSnack = () => {
    //     setShowErc20ApprovalSuccess(false)
    //     setShowStakeTokenSuccess(false)
    // }

    // useEffect(() => {
    //     if (notifications.filter(
    //         (notification) =>
    //             notification.type === 'transactionSucceed' &&
    //             notification.transactionName === 'Approve ERC20 transfer').length > 0) {
    //         console.log("Approved!")
    //         setShowErc20ApprovalSuccess(true)
    //         setShowStakeTokenSuccess(false)
    //     }
    //     if (notifications.filter(
    //         (notification) =>
    //             notification.type === 'transactionSucceed' &&
    //             notification.transactionName === 'Stake Tokens').length > 0) {
    //         console.log("Tokens staked!")
    //         setShowErc20ApprovalSuccess(false)
    //         setShowStakeTokenSuccess(true)
    //     }
    // }, [notifications, showErc20ApprovalSuccess, showStakeTokenSuccess])

//     return (
//         <>
//             <div>
//                 <Input
//                     onChange={handleInputChange} />
//                 <Button
//                     onClick={handleStakeSubmit}
//                     color="primary"
//                     size="large"
//                     disabled={isMining}>
//                     {isMining ? <CircularProgress size={26} /> : "Stake!!!"}
//                 </Button>
//             </div >
//             <Snackbar
//                 open={showErc20ApprovalSuccess}
//                 autoHideDuration={5000}
//                 onClose={handleCloseSnack}>
//                 <Alert onClose={handleCloseSnack} severity="success">
//                     ERC-20 token transfer approved! Now approve the 2nd transaction.
//                 </Alert>
//             </Snackbar>
//             <Snackbar
//                 open={showStakeTokenSuccess}
//                 autoHideDuration={5000}
//                 onClose={handleCloseSnack}>
//                 <Alert onClose={handleCloseSnack} severity="success">
//                     Tokens Staked!
//                 </Alert>
//             </Snackbar>
//         </>
//     )

// }