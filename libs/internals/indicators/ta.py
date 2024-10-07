import pandas as pd
import polars as pl
import pandas_ta as ta

def calculate_ta_indicators(df: pl.DataFrame) -> pl.DataFrame:
    if len(df) < 50:
        raise ValueError("DataFrame must have at least 50 rows")

    df_pandas = df.to_pandas()

    df_pandas.rename(columns={"timestamp": "date"}, inplace=True)
    coin = df_pandas["coin"].iloc[0]
    df_pandas.drop(columns=["coin"], inplace=True)
    df_pandas["date"] = pd.to_datetime(df_pandas["date"], unit="ms")
    df_pandas["open"] = df_pandas["open"].astype(float)
    df_pandas["high"] = df_pandas["high"].astype(float)
    df_pandas["low"] = df_pandas["low"].astype(float)
    df_pandas["close"] = df_pandas["close"].astype(float)
    df_pandas["volume"] = df_pandas["volume"].astype(float)
    df_pandas.ta.macd(append=True)
    df_pandas.ta.rsi(append=True)
    df_pandas.ta.bbands(append=True)
    df_pandas.ta.obv(append=True)

    df_pandas.ta.sma(length=20, append=True)
    df_pandas.ta.ema(length=50, append=True)
    df_pandas.ta.stoch(append=True)
    df_pandas.ta.adx(append=True)

    df_pandas.ta.willr(append=True)
    df_pandas.ta.cmf(append=True)
    df_pandas.ta.psar(append=True)

    df_pandas["OBV_in_million"] = df_pandas["OBV"] / 1e7
    df_pandas["MACD_histogram_12_26_9"] = df_pandas["MACDh_12_26_9"]

    last_day_summary = df_pandas.iloc[-1][
        [
            "open",
            "high",
            "low",
            "close",
            "volume",
            "MACD_12_26_9",
            "MACD_histogram_12_26_9",
            "RSI_14",
            "BBL_5_2.0",
            "BBM_5_2.0",
            "BBU_5_2.0",
            "SMA_20",
            "EMA_50",
            "OBV_in_million",
            "STOCHk_14_3_3",
            "STOCHd_14_3_3",
            "ADX_14",
            "WILLR_14",
            "CMF_20",
            "PSARl_0.02_0.2",
            "PSARs_0.02_0.2",
        ]
    ]

    # Create a separate Series for non-numeric columns
    non_numeric_columns = pd.Series(
        {
            "coin": coin,
            "timestamp": int(df_pandas["date"].iloc[-1].timestamp() * 1000),
            "date": df_pandas["date"].iloc[-1].strftime("%Y-%m-%d"),
        }
    )

    # Combine numeric and non-numeric data
    combined_summary = pd.concat([last_day_summary, non_numeric_columns])

    # Convert to Polars DataFrame
    return pl.from_pandas(combined_summary.to_frame().T)