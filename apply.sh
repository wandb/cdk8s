rm -rf ./dist && pnpm gen && kubectl apply -f ./dist --prune -l app=wandb
