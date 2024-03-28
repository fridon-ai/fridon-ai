from semantic_router import Route
from semantic_router.layer import RouteLayer
from semantic_router.encoders import OpenAIEncoder

defi_stake_borrow_lend_route = Route(
    name="DefiStakeBorrowLend",
    utterances=[
        "I want to stake 100 pyth on pyth governance",
        "Please borrow 100 usdc on Kamino",
        "Lend 100 bonk on Marginify",
        "I want to stake 100 jup on jupiter",
        "Please lend 1123 jup on Kamino",
        "Withdraw 0.01 sol from Kamino",
        "Repay 123 usdc on Kamino",
        "Deposit 100 bonk on Marginify",
        "Supply 10000 dfl on Kamino",
    ]
)

defi_balance = Route(
    name="DeFiBalance",
    utterances=[
        "Can you tell me my sol balance?",
        "What is my lending usdc balance on Kamino?",
        "How much bonk I've borrowed on Marginify?",
        "Can you tell me my staked jup balance on jup governance?",
        "how much jup do I have on kamino lending?"
    ]
)

defi_transfer = Route(
    name="DeFiTransfer",
    utterances=[
        "Transfer 100 sol to 2snYEzbMckwnv85MW3s2sCaEQ1wtKZv2cj9WhbmDuuRD",
        "Send 100 usdc to 2snYEzbMckwnv85MW3s2sCaEQ1wtKZv2cj9WhbmDuuRD",
        "Please, send 100 bonk to ArSZESuVtg5ac7vN8mqmUUgi8Sn8HVh46vq3KmZ86UBY",
    ]
)


defi_talker = Route(
    name="DeFiTalker",
    utterances=[
        "How are you?",
        "Who are you?"
        "What is DeFi?",
        "What is your project about?",
        "For what can I use Kamino?",
        "What is the purpose of Marginify?",
        "What is SPL token?",
        "Tell me about Pyth network",
        "What features your product has?",
        "What is Kamino?",
        "What is the purpose of Jupiter?",
        "How can I use landing on Kamino?",
        "What does pyth do?",
    ]
)


defi_news = Route(
    name="News",
    utterances=[
        "What is the latest news on my followed Discords?",
        "Summarize the latest news on my Defiland's announcements",
        "What is the today's news on Twitter?",
    ]
)


coin_search = Route(
    name="CoinSearch",
    utterances=[
        "Give me list of coins which are in top 100 and are AI based",
        "Find coins which have the same chart as Wif between 1-25 Dec 2023",
        "Search for coins which have bullish divergence and are in top 100 market cap",
        "Give me coins from solana ecosystem which are in top 100 market cap",
        "What coins are similar to rndr?",
        "Which coins have AI product?",
    ]
)


routes = [defi_stake_borrow_lend_route, defi_balance, defi_talker, defi_news, coin_search, defi_transfer]

rl = RouteLayer(encoder=OpenAIEncoder(), routes=routes)


def get_category(query):
    print("Get Category", query['query'])
    category = rl(query['query']).name
    print("Category", category)
    return category
