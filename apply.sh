# Requires kubectl client 1.27 or higher
rm -rf ./dist && pnpm gen && KUBECTL_APPLYSET=true kubectl apply -f ./dist #--applyset=applyset --prune -n default
