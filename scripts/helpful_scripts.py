from brownie import (
    network,
    accounts,
    config,
    interface,
    MockV3Aggregator,
    MockDAI,
    MockWETH,
    Contract,
)
import os
import time

# This is 2000
INITIAL_PRICE_FEED_VALUE = 2000000000000000000000
DECIMALS = 18

# Set a default gas price
from brownie.network import priority_fee

OPENSEA_URL = "https://testnets.opensea.io/assets/{}/{}"
NON_FORKED_LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["hardhat", "development", "ganache"]
LOCAL_BLOCKCHAIN_ENVIRONMENTS = NON_FORKED_LOCAL_BLOCKCHAIN_ENVIRONMENTS + [
    "mainnet-fork",
    "binance-fork",
    "matic-fork",
]

contract_to_mock = {
    "eth_usd_price_feed": MockV3Aggregator,
    "dai_usd_price_feed": MockV3Aggregator,
    "fau_token": MockDAI,
    "weth_token": MockWETH,
}


def get_account(index=None, id=None):
    if index:
        return accounts[index]
    if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        return accounts[0]
    if id:
        return accounts.load(id)
    if network.show_active() in config["networks"]:
        return accounts.add(config["wallets"]["from_key"])
    return None


def get_contract(contract_name):
    """If you want to use this function, go to the brownie config and add a new entry for
    the contract that you want to be able to 'get'. Then add an entry in the in the variable 'contract_to_mock'.
    You'll see examples like the 'link_token'.
        This script will then either:
            - Get a address from the config
            - Or deploy a mock to use for a network that doesn't have it

        Args:
            contract_name (string): This is the name that is refered to in the
            brownie config and 'contract_to_mock' variable.

        Returns:
            brownie.network.contract.ProjectContract: The most recently deployed
            Contract of the type specificed by the dictonary. This could be either
            a mock or the 'real' contract on a live network.
    """
    contract_type = contract_to_mock[contract_name]
    if network.show_active() in NON_FORKED_LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        if len(contract_type) <= 0:
            deploy_mocks()
        contract = contract_type[-1]
    else:
        try:
            contract_address = config["networks"][network.show_active()][contract_name]
            contract = Contract.from_abi(
                contract_type._name, contract_address, contract_type.abi
            )
        except KeyError:
            print(
                f"{network.show_active()} address not found, perhaps you should add it to the config or deploy mocks?"
            )
            print(
                f"brownie run scripts/deploy_mocks.py --network {network.show_active()}"
            )
    return contract


def get_publish_source():
    if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS or not os.getenv(
        "ETHERSCAN_TOKEN"
    ):
        return False
    else:
        return True


def fund_with_weth(
    contract_address, account=None, weth_token=None, amount=1000000000000000000
):
    account = account if account else get_account()
    weth_token = weth_token if weth_token else get_contract("eth_token")
    tx = interface.LinkTokenInterface(weth_token).transfer(
        contract_address, amount, {"from": account}
    )
    print(f"Funded {contract_address}")
    return tx


def fund_with_dai(
    contract_address, account=None, dai_token=None, amount=1000000000000000000
):
    account = account if account else get_account()
    dai_token = dai_token if dai_token else get_contract("dai_token")
    tx = interface.LinkTokenInterface(dai_token).transfer(
        contract_address, amount, {"from": account}
    )
    print(f"Funded {contract_address}")
    return tx


def get_verify_status():
    verify = (
        config["networks"][network.show_active()]["verify"]
        if config["networks"][network.show_active()].get("verify")
        else False
    )
    return verify


def deploy_mocks(decimals=18, initial_value=INITIAL_PRICE_FEED_VALUE):
    """
    Use this script if you want to deploy mocks to a testnet
    """
    # Set a default gas price
    # priority_fee("1 gwei")
    print(f"The active network is {network.show_active()}")
    print("Deploying Mocks...")
    account = get_account()
    print("Deploying Mock Link Token...")
    print("Deploying Mock Price Feed...")
    mock_price_feed = MockV3Aggregator.deploy(
        decimals, initial_value, {"from": account}
    )
    print(f"Deployed to {mock_price_feed.address}")
    print("Deploying Mock DAI...")
    dai_token = MockDAI.deploy({"from": account})
    print(f"Deployed to {dai_token.address}")
    print("Deploying Mock WETH")
    weth_token = MockWETH.deploy({"from": account})
    print(f"Deployed to {weth_token.address}")
