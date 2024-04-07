import { HttpException, Injectable } from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import { getDestinationAddress, getTokenSupply } from './utils/connection';
import { TokenProgramTransactionFactory } from './factories/token-program-transaction-factory';
import { TokenAmount } from './utils/tools/token-amount';
import {
  BalanceOperationType,
  BalanceProviderType,
  BalanceType,
  OperationType,
  PointsProviderType,
  ProviderType,
  SymmetryOperationType,
} from './utils/types';
import { KaminoFactory } from './providers/kamino-factory';
import { BlockchainTools } from './utils/tools/blockchain-tools';
import { WalletFactory } from './providers/wallet-factory';
import {
  SymmetryApiFactory,
  SymmetryFundsType,
} from './providers/symmetry-api-factory';
import { PointsFactory } from './providers/points-factory';
import { JupiterFactory } from './providers/jupiter-factory';

@Injectable()
export class BlockchainService {
  constructor(
    private readonly connection: Connection,
    private readonly tools: BlockchainTools,
    private readonly tokenProgramTransactionFactory: TokenProgramTransactionFactory,
    private readonly kaminoFactory: KaminoFactory,
    private readonly walletFactory: WalletFactory,
    private readonly pointsFactory: PointsFactory,
    private readonly symmetryFactory: SymmetryApiFactory,
    private readonly jupiterFactory: JupiterFactory,
  ) {}

  async swapTokens(
    walletAddress: string,
    fromToken: string,
    toToken: string,
    amount: number,
  ) {
    const fromMintAddress = await this.tools.convertSymbolToMintAddress(
      this.tools.getCurrencySymbol(fromToken),
    );

    const toMintAddress = await this.tools.convertSymbolToMintAddress(
      this.tools.getCurrencySymbol(toToken),
    );

    const tokenInfo = await getTokenSupply(fromMintAddress, this.connection);

    if (!tokenInfo) {
      throw new HttpException('Token not found', 404);
    }

    const decimals = tokenInfo.value.decimals;
    const amountBN = new TokenAmount(amount, decimals, false);

    return await this.jupiterFactory.swapTokens(
      walletAddress,
      fromMintAddress,
      toMintAddress,
      amountBN.toNumber(),
    );
  }

  async getProtocolPoints(walletAddress: string, provider: PointsProviderType) {
    return this.pointsFactory.getPoints(walletAddress, provider);
  }

  async getSymmetryBaskets(): Promise<SymmetryFundsType[]> {
    return await this.symmetryFactory.getAllBaskets();
  }

  async transferTokens(
    from: string,
    to: string,
    currency: string,
    amount: number,
  ): Promise<Uint8Array> {
    // convert symbol if needed
    currency = this.tools.getCurrencySymbol(currency);

    const mintAddress = await this.tools.convertSymbolToMintAddress(currency);

    const tokenInfo = await getTokenSupply(mintAddress, this.connection);

    if (!tokenInfo) {
      throw new HttpException('Token not found', 404);
    }

    const receiver = await getDestinationAddress(this.connection, to);

    if (!receiver) {
      throw new HttpException('Receiver Address not found', 404);
    }

    const decimals = tokenInfo.value.decimals;
    const amountBN = new TokenAmount(amount, decimals, false).toWei();

    const transferTransaction =
      await this.tokenProgramTransactionFactory.generateTransferTransaction(
        from,
        receiver,
        mintAddress,
        amountBN,
        this.connection,
      );

    const serializedTransaction = transferTransaction.serialize();

    return serializedTransaction;
  }

  async balanceOperations(
    walletAddress: string,
    provider: BalanceProviderType,
    operation: BalanceOperationType,
    currency?: string | undefined,
  ): Promise<BalanceType[]> {
    const balances: BalanceType[] = [];

    let mintAddress = currency
      ? await this.tools.convertSymbolToMintAddress(currency)
      : undefined;

    if (currency == 'all') {
      mintAddress = undefined;
    }

    if (
      provider == BalanceProviderType.Kamino ||
      provider == BalanceProviderType.All
    ) {
      if (operation == BalanceOperationType.Borrowed) {
        const positions = await this.kaminoFactory.getKaminoBorrows(
          walletAddress,
          mintAddress,
        );
        if (positions.length == 0) {
          if (mintAddress) {
            return [
              {
                amount: '0',
                mintAddress: mintAddress,
                symbol:
                  await this.tools.convertMintAddressToSymbol(mintAddress),
                value: '0',
                type: 'Borrow',
              },
            ];
          }

          throw new HttpException('Your borrowed balance on Kamino is 0', 404);
        }

        balances.push(
          ...(await this.tools.convertPositionsToBalances(positions, 'Borrow')),
        );
      } else if (operation == BalanceOperationType.Deposited) {
        const positions = await this.kaminoFactory.getKaminoDepositions(
          walletAddress,
          mintAddress,
        );
        if (positions.length == 0) {
          if (mintAddress) {
            return [
              {
                amount: '0',
                mintAddress: mintAddress,
                symbol:
                  await this.tools.convertMintAddressToSymbol(mintAddress),
                value: '0',
                type: 'Deposit',
              },
            ];
          }

          throw new HttpException('Your deposit balance on Kamino is 0', 404);
        }
        balances.push(
          ...(await this.tools.convertPositionsToBalances(
            positions,
            'Deposit',
          )),
        );
      } else if (operation == BalanceOperationType.All) {
        const { deposits, borrows } =
          await this.kaminoFactory.getKaminoBalances(
            walletAddress,
            mintAddress,
          );
        if (deposits.length === 0 && borrows.length === 0) {
          if (mintAddress) {
            return [
              {
                amount: '0',
                mintAddress: mintAddress,
                symbol:
                  await this.tools.convertMintAddressToSymbol(mintAddress),
                value: '0',
              },
            ];
          }

          throw new HttpException('Your balance on Kamino is 0', 404);
        }

        balances.push(
          ...(await this.tools.convertPositionsToBalances(deposits, 'Deposit')),
          ...(await this.tools.convertPositionsToBalances(borrows, 'Borrow')),
        );
      }
    }
    if (
      provider == BalanceProviderType.Wallet ||
      provider == BalanceProviderType.All
    ) {
      // If mint address we need exact token balance, if no lets fetch all ones
      const newBalances = await this.walletFactory.getWalletBalances(
        walletAddress,
        await this.tools.getMintAddresses(),
        mintAddress ? [mintAddress] : [],
      );

      balances.push(
        ...(await this.tools.convertTokenBalancesToBalances(newBalances)),
      );
    }

    if (
      provider == BalanceProviderType.Symmetry ||
      provider == BalanceProviderType.All
    ) {
      if (operation == BalanceOperationType.All) {
        balances.push(
          ...(await this.symmetryFactory.getWalletBaskets(
            walletAddress,
            this.connection.rpcEndpoint,
            mintAddress,
          )),
        );
      }
    }

    return balances;
  }

  async defiOperations(
    walletAddress: string,
    operation: OperationType,
    provider: ProviderType,
    currency: string,
    amount: number,
  ) {
    const mintAddress = await this.tools.convertSymbolToMintAddress(currency);
    const instance = this.getProviderInstance(provider);

    switch (operation) {
      case OperationType.Supply:
        return instance.supply(walletAddress, mintAddress, amount);
      case OperationType.Borrow:
        return instance.borrow(
          walletAddress,
          mintAddress,
          amount,
          this.connection,
        );
      case OperationType.Repay:
        return instance.repay(
          walletAddress,
          mintAddress,
          amount,
          this.connection,
        );
      case OperationType.Withdraw:
        return instance.withdraw(
          walletAddress,
          mintAddress,
          amount,
          this.connection,
        );
      default:
        throw new HttpException('Operation not supported', 403);
    }
  }

  async getSymmetryOperations(
    walletAddress: string,
    basketMintAddress: string,
    amount: number,
    operation: SymmetryOperationType,
  ) {
    if (operation === SymmetryOperationType.Deposit) {
      return await this.symmetryFactory.depositBasketApi(
        walletAddress,
        basketMintAddress,
        amount,
      );
    }

    throw new HttpException('Operation not supported', 403);
  }

  private getProviderInstance(provider: ProviderType) {
    switch (provider) {
      case ProviderType.Kamino:
        return this.kaminoFactory;
      default:
        throw new HttpException('Provider not supported', 403);
    }
  }
}
