<div align="center">

# OpenGuild Sub0 Bangkok Challenges

OpenGuild challenges made for the Sub0 Bangkok Hackathon

</div>

## (Optional) Setup environment and register for the challenges

TLDR: If you are not familiar with Git & Github, follow these steps below to fork and setup your own repository.

- Step 1: Install Git & Github Desktop (optional) on your local device
- Step 2: Fork this repository by click the `Fork button` on Github

![image](https://github.com/openguild-labs/open-hack-rust-starter/assets/56880684/7fa2f01a-b523-4208-92db-d8af7a274d98)

- Step 3: `Clone` the forked repository to your local device using the below command

```sh
git clone https://github.com/<your_github_username>/sub0-bangkok-challenges.git
```

Replace the `[name-of-your-account]` with your Github username. For example, if my username is `chungquantin`, I would do the below command to clone the repository to my local device.

```sh
git clone https://github.com/chungquantin/sub0-bangkok-challenges.git
```

- Step 4: Edit the `README.md` file to register for official participation

Go to **Participant Registration** section and register to be the workshop participants. Add the below to the list, replace any placeholder with your personal information.

````

| 🦄 | Name | Github username | Your current occupation |

```

- Step 5: `Commit` your code and push to the forked Github repository

```

git add .
git commit -m "Register for OpenGuild Sub0 Challenges"

```

- Step 6: Create a `Pull Request` to merge your changes to this repository and name your PR as `Your name | Register for OpenGuild Sub0 Challenges`

<img width="1166" alt="Screenshot 2024-04-19 at 16 23 45" src="https://github.com/openguild-labs/open-hack-rust-starter/assets/56880684/7554ca7d-da68-4a23-893a-4f2c11a78d37">

<div align="center">

## DISCOVER THE LIST OF CHALLENGES 🏆

| Challenge   | Description                                              | Bounty |
| ----------- | -------------------------------------------------------- | ------ |
| Challenge 1 | Using `smoldot` light client to collect and process data | $40    |
| Challenge 2 | Set an on-chain identity from the client with Dedot      | $40    |
| Challenge 3 | Building a parachain from a solochain                    | $60    |

</div>

### Challenge 1: Using `smoldot` light client to collect and process data

Goal: 🎯 Read the data from parachains using `smoldot` light client library and process to return deliverables.

### Challenge 2: Set an on-chain identity from the client with Dedot

Goal: 🎯 Make a transaction to set on-chain identity for connected account

- Initialize DedotClient to connect to Westend People testnet ([WestendPeopleApi](https://github.com/dedotdev/chaintypes/blob/7baa48e8e8e3c8e2dce4ad9ece0a11b9ae98934a/packages/chaintypes/src/westendPeople/index.d.ts#L24))
- Build a form to enter identity information: Display name, Email, Discord handle
- Make a transaction to set on-chain identity for connected account (via [client.tx.identity.setIdentity](https://github.com/dedotdev/chaintypes/blob/7baa48e8e8e3c8e2dce4ad9ece0a11b9ae98934a/packages/chaintypes/src/westendPeople/tx.d.ts#L2283-L2295))
- Fetch & render your on-chain identity (via [client.query.identity.identityOf](https://github.com/dedotdev/chaintypes/blob/7baa48e8e8e3c8e2dce4ad9ece0a11b9ae98934a/packages/chaintypes/src/westendPeople/query.d.ts#L1130-L1134))
- If connected account is already set on-chain identity, show the identity information instead the form.

### Challenge 3: Building a parachain from a solochain

Goal: 🎯 Receiving a solochain template, convert it into parachain.
```
````
