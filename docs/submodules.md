# Working with Arcwright submodules

Clone Arcwright with all maintained components:

```sh
git clone --recurse-submodules https://github.com/unn-corp/Arcwright-AI.git
```

To repair an existing checkout, initialize every nested repository with:

```sh
git submodule update --init --recursive
```

`ungate/` is a standalone maintained Cursor extension. It is not a runtime dependency of Arcwright or T3 Code; its source and release process live in its own repository.
