from random import random
from brownie import network, exceptions, MockDAI
from scripts.helpful_scripts import (
    get_account,
    LOCAL_BLOCKCHAIN_ENVIRONMENTS,
    INITIAL_PRICE_FEED_VALUE,
    DECIMALS,
    get_contract,
    fund_with_dai,
    fund_with_weth,
)
from scripts.deploy import deploy_token_farm_and_dapp_token, KEPT_BALANCE
import pytest
from web3 import Web3


def test_set_price_feed_contract():
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    non_owner = get_account(index=1)
    price_feed_address = get_contract("eth_usd_price_feed")
    token_farm, dapp_token = deploy_token_farm_and_dapp_token()
    # Act
    token_farm.setPriceFeedContract(
        dapp_token.address, price_feed_address, {"from": account}
    )
    # Assert
    assert token_farm.tokenPriceFeedMapping(dapp_token.address) == price_feed_address
    # Make sure that non-owner cannot call the function
    with pytest.raises(exceptions.VirtualMachineError):
        token_farm.setPriceFeedContract(
            dapp_token.address, price_feed_address, {"from": non_owner}
        )


def test_stake_tokens(amount_staked):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    token_farm, dapp_token = deploy_token_farm_and_dapp_token()
    # Act
    # Approve for almost unlimited amount
    dapp_token.approve(token_farm.address, amount_staked, {"from": account})
    token_farm.stakeTokens(amount_staked, dapp_token.address, {"from": account})
    # Assert
    assert (
        token_farm.stakingBalance(dapp_token.address, account.address) == amount_staked
    )
    assert token_farm.uniqueTokensStaked(account.address) == 1
    assert token_farm.stakers(0) == account.address
    return token_farm, dapp_token


def test_issue_tokens(amount_staked):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    token_farm, dapp_token = test_stake_tokens(amount_staked)
    starting_balance = dapp_token.balanceOf(account.address)
    # Act
    token_farm.issueTokens({"from": account})
    # Arrange
    # We are staking 1 dapp_token == in price to 1 ETH
    # So we should get 2,000 dapp tokens in reward, since the price
    # of eth is $2,000
    assert (
        dapp_token.balanceOf(account.address)
        == starting_balance + INITIAL_PRICE_FEED_VALUE
    )


def test_add_allowed_tokens():
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    non_owner = get_account(index=2)
    token_farm, dapp_token = deploy_token_farm_and_dapp_token()
    fau_token = get_contract("fau_token")
    # Act
    token_farm.addAllowedTokens(fau_token.address, {"from": account})
    # Assert
    assert token_farm.allowedTokens(1) == fau_token  # The 1st index is the fau_token
    # Test to make sure only owner can add token
    with pytest.raises(exceptions.VirtualMachineError):
        token_farm.addAllowedTokens(token_farm.address, {"from": non_owner})


def test_token_is_allowed(random_erc20):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    token_farm, dapp_token = deploy_token_farm_and_dapp_token()
    # Act
    test_add_allowed_tokens()
    # Assert
    token_is_allowed = token_farm.tokenIsAllowed(dapp_token, {"from": account})
    token_is_not_allowed = token_farm.tokenIsAllowed(random_erc20, {"from": account})
    assert token_is_allowed == True
    assert token_is_not_allowed is False


def test_stake_unapproved_tokens(random_erc20, amount_staked):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    token_farm, dapp_token = deploy_token_farm_and_dapp_token()
    # Act
    random_erc20.approve(token_farm.address, amount_staked, {"from": account})
    # Assert
    with pytest.raises(exceptions.VirtualMachineError):
        token_farm.stakeTokens(amount_staked, random_erc20, {"from": account})


def test_unstake_tokens(amount_staked):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    token_farm, dapp_token = test_stake_tokens(amount_staked)
    # Act
    token_farm.unstakeTokens(dapp_token.address, {"from": account})
    # Assert
    assert (
        token_farm.uniqueTokensStaked(account.address) == 0
    )  # Because user has withdrawn the staked token
    assert token_farm.stakingBalance(dapp_token.address, account.address) == 0
    assert dapp_token.balanceOf(account.address) == KEPT_BALANCE


def test_get_user_total_balance_with_different_tokens_and_amounts(
    amount_staked, random_erc20
):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    account = get_account()
    token_farm, dapp_token = test_stake_tokens(amount_staked)
    fau_token = get_contract("fau_token")
    weth_token = get_contract("weth_token")
    # Act
    fau_token.approve(account.address, 1000, {"from": account})
    weth_token.approve(account.address, 0.5, {"from": account})
    token_farm.addAllowedTokens(random_erc20, {"from": account})
    token_farm.setPriceFeedContract(
        random_erc20.address, get_contract("eth_usd_price_feed"), {"from": account}
    )
    random_erc20_stake_amount = amount_staked * 2
    random_erc20.approve(
        token_farm.address, random_erc20_stake_amount, {"from": account}
    )
    token_farm.stakeTokens(
        random_erc20_stake_amount, random_erc20.address, {"from": account}
    )
    user_total_worth = token_farm.getUserTotalValue(account.address)
    print(user_total_worth)
    # Assert
    assert (
        user_total_worth == INITIAL_PRICE_FEED_VALUE * 3
    )  # The original amount is 2000, so it has to be bigger than this


def test_get_token_eth_price():
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    token_farm, dapp_token = deploy_token_farm_and_dapp_token()
    # Act / Assert
    assert token_farm.getTokenValue(dapp_token.address) == (
        INITIAL_PRICE_FEED_VALUE,
        DECIMALS,
    )


def test_get_user_token_staking_balance_eth_value(amount_staked):
    # Arrange
    account = get_account()
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("Only for local testing")
    token_farm, dapp_token = test_stake_tokens(amount_staked)
    # Act
    staked_eth_value = token_farm.getUserSingleTokenValue(
        account.address, dapp_token.address
    )
    price_of_eth, decimals = token_farm.getTokenValue(dapp_token.address)
    # Assert
    assert (
        token_farm.stakingBalance(dapp_token.address, account.address)
        * price_of_eth
        / (10**decimals)
        == staked_eth_value
    )
