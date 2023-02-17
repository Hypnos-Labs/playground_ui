import type { NextPage } from 'next'
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useSigningClient } from '../contexts/cosmwasm'
import { Coin } from "@cosmjs/amino";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { toUtf8 } from "@cosmjs/encoding";
import { EncodeObject } from '@cosmjs/proto-signing'

const route = ({
  sender,
  contractAddr,
}: {
  sender: string;
  contractAddr: string;
}, funds?: Coin[]): MsgExecuteContractEncodeObject => {
  return {
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: MsgExecuteContract.fromPartial({
      sender: sender,
      contract: contractAddr,
      msg: toUtf8(JSON.stringify({
        route: {}
      })),
      funds
    })
  };
};

const routeWithSender = ({
  sender,
  contractAddr,
}: {
  sender: string;
  contractAddr: string;
}, funds?: Coin[]): MsgExecuteContractEncodeObject => {
  return {
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: MsgExecuteContract.fromPartial({
      sender: sender,
      contract: contractAddr,
      msg: toUtf8(JSON.stringify({
        route_with_sender: {}
      })),
      funds
    })
  };
};

const Home: NextPage = () => {

  const [wasmFile, setWasmFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [id, setId] = useState<Number>(0);
  const [contractAddress, setContractAddress] = useState<string>("N/A");
  const [amount, setAmount] = useState<Number>();
  
  const { walletAddress, signingClient, nickname, connectWallet, disconnect } =
    useSigningClient();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setWasmFile(e.target.files[0])
  }

  useEffect(() => {
    if (wasmFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          if (!e.target?.result) return console.log('error in file')
          const bytes = new Uint8Array(e.target.result as ArrayBuffer)
          setBytes(bytes)
        } catch (error: any) {
          console.log(error.message);
        }
      }
      reader.readAsArrayBuffer(wasmFile)
    }
  }, [wasmFile])

  const handleConnect = () => {
    if (walletAddress.length === 0) {
      connectWallet();
    } else {
      disconnect();
    }
  };

  const reconnect = useCallback(() => {
    disconnect();
    connectWallet();
  }, [disconnect, connectWallet]);

  useEffect(() => {
    window.addEventListener("keplr_keystorechange", reconnect);

    return () => {
      window.removeEventListener("keplr_keystorechange", reconnect);
    };
  }, [reconnect]);

  const upload = async () => {
    try {
      if (walletAddress.length < 3 || !signingClient) {
        console.log("No wallet connected");
        return;
      }
      if (!bytes || !wasmFile) {
        console.log("no file uploaded");
        return;
      }

      const result = await signingClient.upload(walletAddress, bytes, "auto");
      setId(result.codeId);
      console.log("upload TX Hash: " + result.transactionHash);
      console.log("og size: " + result.originalSize + " ||| compressed size: " + result.compressedSize);
      console.log("og checksum: " + result.originalChecksum);
      console.log("compressed checksum: " + result.compressedChecksum);
      console.log("-----------------");
      console.log("CODE ID: " + result.codeId);
      console.log("-----------------");

      const res = await signingClient.instantiate(
        walletAddress, 
        result.codeId, 
        {}, 
        "test", 
        "auto"
      )

      setContractAddress(res.contractAddress);

      console.log("~~~~~~~~~~~~~~~~~~");
      console.log("~~~~~~~~~~~~~~~~~~");
      console.log("~~~~~~~~~~~~~~~~~~");
      console.log("Contract address: " + res.contractAddress);
      console.log("Init tx hash: " + res.transactionHash)
      console.log("Gas used: " + res.gasUsed);
      console.log("Gas wanted: " + res.gasWanted);

    } catch (err: any) {
      console.log(err.message)
    }
  }

  const init = async (id: number) => {
    try {
      if (walletAddress.length < 3 || !signingClient) {
        console.log("No wallet connected");
        return;
      }

      const res = await signingClient.instantiate(
        walletAddress, 
        id, 
        {}, 
        "test", 
        "auto"
      )

      setContractAddress(res.contractAddress);

      console.log("~~~~~~~~~~~~~~~~~~");
      console.log("~~~~~~~~~~~~~~~~~~");
      console.log("~~~~~~~~~~~~~~~~~~");
      console.log("Contract address: " + res.contractAddress);
      console.log("Init tx hash: " + res.transactionHash)
      console.log("Gas used: " + res.gasUsed);
      console.log("Gas wanted: " + res.gasWanted);

    } catch (err: any) {
      console.log(err.message)
    }

  }

  const handleSendUsdc = async (amount: Number | undefined) => {
    try {
      if (walletAddress.length < 3 || !signingClient || !amount) {
        console.log("No wallet connected");
        return;
      }

      var funds: Coin[] = [
        {
          amount: amount.toString(),
          denom: "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
        } as Coin,
      ];

      const msg: EncodeObject[] = [route({
        sender: walletAddress,
        contractAddr: contractAddress,
      }, funds)];

      const res = await signingClient.signAndBroadcast(walletAddress, msg, "auto");

      console.log("TX hash: " + res.transactionHash);

    } catch (err: any) {
      console.log(err.message)
    }
  }

  const handleSendJuno = async (amount: Number | undefined) => {
    try {
      if (walletAddress.length < 3 || !signingClient || !amount) {
        console.log("No wallet connected");
        return;
      }

      var funds: Coin[] = [
        {
          amount: amount.toString(),
          denom: "ujuno",
        } as Coin,
      ];

      const msg: EncodeObject[] = [route({
        sender: walletAddress,
        contractAddr: contractAddress,
      }, funds)];

      const res = await signingClient.signAndBroadcast(walletAddress, msg, "auto");

      console.log("TX hash: " + res.transactionHash);

    } catch (err: any) {
      console.log(err.message)
    }
  }



  return (
    <div className="flex min-h-screen h-screen flex-col py-2">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="grid grid-rows-6 w-full h-full border-2 border-black">
        <div className="row-span-2 flex px-10 justify-between border border-red-600">
          <div className="flex flex-col border-4 gap-y-2">

          <button onClick={() => init(1)} className="border-2 border-purple-600 hover:bg-green-500/50 rounded-xl h-1/4 px-2 py-1">
            Upload or Init
          </button>
          <input
            accept=".wasm"
            className="bg-gray-500 file:border-purple-600 file:hover:bg-green-500/50 h-full"
            onChange={onFileChange}
            type="file"
          />
          </div>
          <div className="border-purple-500">
            {"Current Code ID: " + id  +  "bytes: " + bytes?.length}
          </div>
          <button 
            className="border-2 border-purple-600 hover:bg-green-500/50 rounded-xl h-1/4 px-2 py-1"
            onClick={handleConnect}
          >
            {walletAddress.length < 3 ? "Connect" : nickname}
          </button>
        </div>
        <div className="row-span-4 flex gap-x-4 justify-center items-center border-2 border-blue-500">
          <input className="border border-purple-500" type="number" onChange={e => setAmount(e.target.valueAsNumber)}>
          </input>
          <button 
            className="border-2 border-purple-600 hover:bg-green-500/50 rounded-xl px-2 py-1"
            onClick={() => handleSendJuno(amount)}
          >
            Send ujuno
          </button>
          <button 
            className="border-2 border-purple-600 hover:bg-green-500/50 rounded-xl px-2 py-1"
            onClick={() => handleSendUsdc(amount)}
          >
            Send uusdc
          </button>
        </div>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t">
        <a
          className="flex items-center justify-center gap-2"
          href="https://github.com/hypnos-labs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>
      </footer>
    </div>
  )
}


// const Home: NextPage = () => {
//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center py-2">
//       <Head>
//         <title>Create Next App</title>
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
//         <h1 className="text-6xl font-bold">
//           Welcome to{' '}
//           <a className="text-blue-600" href="https://nextjs.org">
//             Next.js!
//           </a>
//         </h1>

//         <p className="mt-3 text-2xl">
//           Get started by editing{' '}
//           <code className="rounded-md bg-gray-100 p-3 font-mono text-lg">
//             pages/index.tsx
//           </code>
//         </p>

//         <div className="mt-6 flex max-w-4xl flex-wrap items-center justify-around sm:w-full">
//           <a
//             href="https://nextjs.org/docs"
//             className="mt-6 w-96 rounded-xl border p-6 text-left hover:text-blue-600 focus:text-blue-600"
//           >
//             <h3 className="text-2xl font-bold">Documentation &rarr;</h3>
//             <p className="mt-4 text-xl">
//               Find in-depth information about Next.js features and its API.
//             </p>
//           </a>

//           <a
//             href="https://nextjs.org/learn"
//             className="mt-6 w-96 rounded-xl border p-6 text-left hover:text-blue-600 focus:text-blue-600"
//           >
//             <h3 className="text-2xl font-bold">Learn &rarr;</h3>
//             <p className="mt-4 text-xl">
//               Learn about Next.js in an interactive course with quizzes!
//             </p>
//           </a>

//           <a
//             href="https://github.com/vercel/next.js/tree/canary/examples"
//             className="mt-6 w-96 rounded-xl border p-6 text-left hover:text-blue-600 focus:text-blue-600"
//           >
//             <h3 className="text-2xl font-bold">Examples &rarr;</h3>
//             <p className="mt-4 text-xl">
//               Discover and deploy boilerplate example Next.js projects.
//             </p>
//           </a>

//           <a
//             href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
//             className="mt-6 w-96 rounded-xl border p-6 text-left hover:text-blue-600 focus:text-blue-600"
//           >
//             <h3 className="text-2xl font-bold">Deploy &rarr;</h3>
//             <p className="mt-4 text-xl">
//               Instantly deploy your Next.js site to a public URL with Vercel.
//             </p>
//           </a>
//         </div>
//       </main>

//       <footer className="flex h-24 w-full items-center justify-center border-t">
//         <a
//           className="flex items-center justify-center gap-2"
//           href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Powered by{' '}
//           <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
//         </a>
//       </footer>
//     </div>
//   )
// }

export default Home
