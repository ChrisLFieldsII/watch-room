echo -e '🟡 running prepare-release\n'

#REGION: variables
ALLOW_DEBUG="false"
IGNORE_GIT="false"

#REGION: colors
RED='\033[0;31m'          # Red
YELLOW='\033[0;33m'       # Yellow
NO_COLOR='\033[0m'       # Text Reset

#REGION: parse flags. pulled from here: https://stackoverflow.com/a/14203146/5434172
while test $# -gt 0; do
    case "$1" in
        --allow-debug)
            # allow .env.prod to have ENABLE_DEBUG set to true       

            shift # shift past the flag. no need to do another shift past the value
            ALLOW_DEBUG="true"
        ;;
        --ignore-git)
            # ignore git status check

            shift
            IGNORE_GIT="true"
        ;;
        *)
            break
        ;;
    esac
done

#REGION: ensure git status is clean
if [[ $(git status --porcelain) && $IGNORE_GIT == *"false"* ]]; then
    echo -e "${RED}Error: git status is not clean. Please commit or stash your changes before running this script"
    exit 1
fi

#REGION: read .env.prod and ensure values look as expected
envFile=`cat .env.prod`
echo -e 'Using the following .env.prod file:'
while IFS= read -r line; do
    echo -e "${YELLOW}${line}"
done <<< "$envFile"

while IFS= read -r line; do
    # ignore commented lines
    if [[ $line =~ ^#.* ]]; then
        continue
    fi

    if [[ $line == *"SERVER_URI"* && $line == *"localhost"* ]]; then
        echo -e "${RED}Error: SERVER_URI is set to localhost. Please update .env.prod to use the correct SERVER_URI"
        exit 1
    fi

    if [[ $line == *"ENABLE_DEBUG"* && $line == *"true"* && $ALLOW_DEBUG == *"false"* ]]; then
        echo -e "${RED}Error: ENABLE_DEBUG is set to true. Please update .env.prod to use the correct ENABLE_DEBUG value of false"
        exit 1
    fi
done <<< "$envFile"

# NOTE: all checks have passed at this point

#REGION: clean up release-artifacts dir
rm -r release-artifacts/*

#REGION: build the extension code
echo -e "\n${NO_COLOR}Running yarn build:prod..."
yarn build:prod

#REGION: zip extension and mv to release-artifacts dir
echo -e "\n${NO_COLOR}Zipping up the extension and moving to release-artifacts dir"
zip -r watchroomext.zip dist browserAction icons manifest.json 
filename=$([[ $ALLOW_DEBUG == *"true"* ]] && echo "watchroomext-debug.zip" || echo "watchroomext.zip")
mv watchroomext.zip "release-artifacts/${filename}"

#REGION: git tag
echo -e "\n${NO_COLOR}Creating git tag..."
TAG_VERSION=$(node -p "require('./manifest.json').version")
COMMIT_MSG=$(git log -1 --oneline | cut -c 8-$COLUMNS | xargs)
git tag -a "v${TAG_VERSION}" -m "v${TAG_VERSION} ${COMMIT_MSG}" -f
echo "Remember to manually push tag to remote: git push origin v${TAG_VERSION}"

echo -e "\n✅ prepare-release complete. view it at release-artifacts/${filename}"
