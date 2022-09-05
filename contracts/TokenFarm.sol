//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenFarm is Ownable {
    // mapping of token address --> staker address --> amount
    mapping(address => mapping(address => uint256)) public stakingBalance;
    mapping(address => uint256) public uniqueTokensStaked;
    address[] public stakers;
    address[] public allowedTokens;
    IERC20 public dappToken

    constructor(address _dappTokenAddress) public{
        dappToken = IERC20(_dappTokenAddress)
    }

    // stakeTokens
    function stakeTokens(uint256 _amount, address _token) public {
        require(_amount > 0, "Amount must be more than 0");
        require(tokenIsAllowed(_token), 'Token is currently not allowed!')
        // call the transferFrom function, this function only works by getting outsider to approve the token for the current contract
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        updateUniqueTokensStaked(msg.sender, _token);
        stakingBalance[_token][msg.sender] = stakingBalance[_token][msg.sender] + _amount;
        if (uniqueTokensStaked[msg.sender] == 1){
            stakers.push(msg.sender)
        }
    }
    
    function updateUniqueTokensStaked(address _user, address _token) internal {
        if(stakingBalance[_token][_user] <= 0){
            uniqueTokensStaked[_user] = uniqueTokensStaked[_user] + 1
        }
    }
    // unstakeTokens

    // issueTokens
    // Assume for every 1 ETH, we give 1 DappToken
    // E.g. 50 ETH and 50 DAI staked, and we want to give a reward of 1 DAPP/ 1 DAI
    function issueTokens() public OnlyOwner {
        for (uint256 stakersIndex = 0; stakersIndex < stakers.length; stakersIndex++)
        {
            address recipient = stakers[stakersIndex];
            uint256 userTotalValue = getUserTotalValue(recipient);
            dappToken.transfer(recipient)
        }
    }

    function getUserTotalValue(address _user){
        
    }

    // addAllowedTokens
    function addAllowedTokens(address _token) public onlyOwner{
        allowedTokens.push(_token);
    }

    function tokenIsAllowed(address _token) public returns (bool){
        for(uint256 allowedTokensIndex=0; allowedTokensIndex < allowedTokens.length){
            if (allowedTokens[allowedTokensIndex] == _token){
                return true;
            }
        }
        return False
    }

    // getEthValue
}
