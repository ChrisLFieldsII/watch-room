echo -e '🟡 running prepare-release\n'

#REGION: variables
ALLOW_DEBUG="false"

#REGION: colors
RED='\033[0;31m'          # Red
YELLOW='\033[0;33m'       # Yellow
NO_COLOR='\033[0m'       # Text Reset

# TODO: add check for git status and ensure it's clean before running this script   

#REGION: parse flags. pulled from here: https://stackoverflow.com/a/14203146/5434172
while test $# -gt 0; do
  case "$1" in
    --allow-debug)
        # allow .env.prod to have ENABLE_DEBUG set to true       
        # shift past the flag. no need to do another shift past the value
      shift
      ALLOW_DEBUG="true"
      ;;
    # --action*)
    #   echo 'passed --action'
    #   shift
    #   ;;
    *)
      break
      ;;
  esac
done

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

#REGION: build the extension code
echo -e "\n${NO_COLOR}Running yarn build:prod"
yarn build:prod

#REGION: zip extension and mv to release-artifacts dir
echo -e "\n${NO_COLOR}Zipping up the extension and moving to release-artifacts dir"
zip -r watchroomext.zip dist browserAction icons manifest.json 
mv watchroomext.zip release-artifacts/watchroomext.zip

echo -e "\n✅ prepare-release complete"
