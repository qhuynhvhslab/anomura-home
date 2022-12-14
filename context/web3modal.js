// import * as UAuthWeb3Modal from '@uauth/web3modal'
// import UAuthSPA from '@uauth/js'
// import WalletConnectProvider from '@walletconnect/web3-provider'
// import Web3Modal from 'web3modal'

// // These options are used to construct the UAuthSPA instance.
// export const uauthOptions = {
//     clientID: process.env.NEXT_PUBLIC_UNSTOPPABLE_CLIENT_ID,
//     redirectUri: process.env.NEXT_PUBLIC_UNSTOPPABLE_REDIRECT_URI,

//     // Must include both the openid and wallet scopes.
//     scope: 'openid wallet',
// }

// const providerOptions = {
//     // Currently the package isn't inside the web3modal library. For now,
//     // users must use this libary to create a custom web3modal provider.

//     // All custom `web3modal` providers must be registered using the "custom-"
//     // prefix.
//     'custom-uauth': {
//         // The UI Assets
//         display: UAuthWeb3Modal.display,

//         // The Connector
//         connector: UAuthWeb3Modal.connector,

//         // The SPA libary
//         package: UAuthSPA,

//         // The SPA libary options
//         options: uauthOptions,
//     },

//     // For full functionality we include the walletconnect provider as well.
//     walletconnect: {
//         package: WalletConnectProvider,
//         options: {
//             infuraId: 'INFURA_ID',
//         },
//     },

//     // Include any other web3modal providers here
// }

// const web3modal = new Web3Modal({ providerOptions })

// // Register the web3modal so the connector has access to it.
// UAuthWeb3Modal.registerWeb3Modal(web3modal)

// export default web3modal