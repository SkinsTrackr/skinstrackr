<div align="center">

<img src="resources/icon.png" alt="SkinsTrackr Logo" width="120" />

# SkinsTrackr

### Yet another CS2 Inventory Manager

[Download](#-download) • [Features](#-features) • [Showcase](#-showcase) • [FAQ](#-building-from-source)

</div>

---

SkinsTrackr is a desktop application designed to help Counter-Strike 2 players manage their in-game inventories. SkinsTrackr provides inventory tracking, storage unit transfers, offline inventory caching and multi-account support.

---

## Download latest

| Platform    | Download                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Windows     | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.0.1/SkinsTrackr-Setup-1.0.1.exe) |
| macOS (ARM) | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.0.1/SkinsTrackr-1.0.1-arm64.dmg) |
| Linux       | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.0.1/SkinsTrackr-1.0.1.AppImage)  |

**Older versions:** See [Releases](https://github.com/SkinsTrackr/skinstrackr/releases) for version history and changelog.

---

## Features

- **Complete Inventory View** - Browse your entire CS2 inventory including storage units.
- **Offline Inventory Caching** - Log in once and your inventory is saved locally. View your items anytime without needing to re-authenticate every session.
- **Storage Unit transferring** - Move items from/to storage units.
- **Multi-account support** - Manage multiple Steam accounts in one application. Each account is cached offline.
- **Advanced Filtering** - Search, filter and group items by name, rarity, price, and more.
- **Up-to-date market pricing** - Recent prices from SCM.

---

## Showcase

### Inventory View

[Inventory View](https://github.com/user-attachments/assets/b4919360-6464-4d77-9288-de031d26f579)

### Item Transfer

[Item Transfer](https://github.com/user-attachments/assets/fa523a6f-1093-4318-b3b1-f4711b9acea8)

### Multi-Account Management and Caching

[Multi-Account Management and Caching](https://github.com/user-attachments/assets/ab86efda-b637-4a84-a08a-bcab189614b1)

---

## ❓ FAQ

### Will I get VAC banned using this tool?

Short answer: No

Long answer:

1. This tool does not interact with any of your game files, nor the CS2 game servers. It is not even required to have the game installed to use skinstrackr.
2. As most other inventory managers, this app uses DoctorMcKay's [node-steamuser](https://github.com/DoctorMcKay/node-steam-user) + [node-globaloffensive](https://github.com/DoctorMcKay/node-globaloffensive). Both are mature libraries to interact with the Steam network and CS2 Game Coordinator.

### How often does my inventory sync?

Every time you login, SkinsTrackr will automatically look for changes in the inventory/containers and update your locally saved inventory.
This is also the case every time you transfer any items.

You can also manually trigger a sync at any time using the refresh button in the user overview in the bottom left.

### Is all my data private? Where is it stored?

Since SkinsTrackr currently only supports the Steam Web token for login (which is a one-time-use), no credentials or sensitive info is stored at all. The only stored data are logged in users with their cached inventories.

Nothing is ever sent to external servers except for the necessary Steam API calls to retrieve your profile and inventory.

---

## Author

**jzimr (Oooodin)**

- Github: [jzimr](https://github.com/jzimr)
- Discord: Oooodin (Ooodin#1626)
- Steam: [Oooodin](https://steamcommunity.com/id/oooodin/)

---

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.
