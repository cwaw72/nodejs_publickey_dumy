/*
  description: pInfo publicId 생성
    정책
      - maxPublicValue ~ maxPublicValue + 10000 난수를 생성
      - 결제 시 생성되는 publicId
      - public key 가 부족한 경우 다른 템플릿으로 변경해야함 ex) a_00000000 -> b_00000000; (이전과는 다르게 해야함)
      - 10000개씩 나누어서 저장 됨
    FLOW :
      1. 프레임 데이터 가져오기
        1-1. 프레임 생성
        1-2. 프레임 체크 및 업데이트
      2. public key 생성
  @author: jun
  @date: 2021-11-15
*/

// 모듈
import Logger from '../../../core/Logger';

// 외부 api

// 모델
import reqInfoInf from '../../../database/Inf/reqInfoInf';
import PIntoPublicId from '../../../database/mongoose/model/purchasedInfo/publicId/PIntoPublicId';
import PIntoPublicIdFrame from '../../../database/mongoose/model/purchasedInfo/publicId/PIntoPublicIdFrame';
// import PInfoInf from '../../../database/mongoose/model/purchasedInfo/PInfo';

// 모델 repo
import PInfoPublicIdRepo from '../../../database/mongoose/repository/purchasedInfo/publicId/PInfoPublicIdRepo';
import PInfoPublicIdFrameRepo from '../../../database/mongoose/repository/purchasedInfo/publicId/PInfoPublicIdFrameRepo';

export interface dataInf {}

const PREFIX_PUBLIC_VALUE = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

// interface apiResultInf { }

const START_PREFIX_PUBLIC_VALUE = 'a';
const MAX_PUBLIC_VALUE = 99;

const CREATE_NUMS = 10;

// 생성될 수
const apiName = 'PInfo publicId 생성';
export default async function createPublicId(reqInfo: reqInfoInf, data: dataInf) : Promise<void> {
  Logger.info({ __filename, reqInfo }, `${apiName} - 시작`, 'data', data);
  // const s = Number(new Date());
  // console.log('start', s);

  // 1. 프레임 검색
  const { prefixPublicValue, startPublicValue, endPublicValue, maxPublicValueLength } = await getPublicIdFrame(reqInfo);

  // 2. public key 생성
  await createPublicIdList(reqInfo, data, prefixPublicValue, startPublicValue, endPublicValue, maxPublicValueLength);

  // const e = Number(new Date());
  // console.log('result', result);
  // console.log('end', e);
  // console.log(e - s);
}

// 1. 프레임 데이터 가져오기
async function getPublicIdFrame(reqInfo: reqInfoInf) : Promise<{
  prefixPublicValue : string;
  startPublicValue : number;
  endPublicValue : number;
  maxPublicValueLength : number;
}> {
  // 1-1. 프레임 생성
  async function createPublicIdFram() {
    const publicIdFrame = PInfoPublicIdFrameRepo.init();
    publicIdFrame.publicPrefixValue = START_PREFIX_PUBLIC_VALUE;
    publicIdFrame.maxPublicValue = MAX_PUBLIC_VALUE;
    publicIdFrame.createNums = CREATE_NUMS;
    publicIdFrame.lastPublicValue = 0;
    publicIdFrame.lastModifiedData = new Date();
    Logger.info({ __filename, reqInfo }, `${apiName} - 프레임 데이터 생성`, 'publicIdFrame', publicIdFrame);
    await PInfoPublicIdFrameRepo.create(publicIdFrame);
    return publicIdFrame;
  }
  // 1-2. 프레임 체크 및 업데이트
  async function checkAndUpatePublicIdFrame(publicIdFrame : PIntoPublicIdFrame) : Promise<{
    prefixPublicValue : string;
    startPublicValue : number;
    endPublicValue : number;
    maxPublicValueLength : number;
  }> {
    Logger.info({ __filename, reqInfo }, `${apiName} - 프레임 체크 및 업데이트 시작`, 'publicIdFrame', publicIdFrame);
    const maxPublicValue = publicIdFrame.maxPublicValue;
    const createNums = publicIdFrame.createNums;

    const prefixPublicValue = publicIdFrame.publicPrefixValue;
    const startPublicValue = publicIdFrame.lastPublicValue + 1;
    // console.log('startPublicValue', startPublicValue);
    let endPublicValue = startPublicValue + createNums;
    // console.log('endPublicValue', endPublicValue);
    const maxPublicValueLength = String(maxPublicValue).length;

    // 최대값 넘을 시
    if (endPublicValue >= maxPublicValue) {
      endPublicValue = maxPublicValue + 1;
      const updatePublicPrefixValue = PREFIX_PUBLIC_VALUE[PREFIX_PUBLIC_VALUE.indexOf(prefixPublicValue) + 1] || 'last';
      Logger.info({ __filename, reqInfo }, `${apiName} - 프레임 체크 및 업데이트 최대값 넘었다.`,
        'updatePublicPrefixValue', updatePublicPrefixValue,
        'lastPublicValue', 0);
      const beforeData = await PInfoPublicIdFrameRepo.findByIdAndUpdate(publicIdFrame._id, {
        publicPrefixValue: updatePublicPrefixValue,
        lastPublicValue: 0,
        lastModifiedData: new Date(),
      });
      console.log('beforeData 1', beforeData, 'maxPublicValue 1', maxPublicValue);
      if (beforeData && beforeData.lastPublicValue + beforeData.createNums < maxPublicValue) {
        throw Logger.error({ __filename, reqInfo }, `${apiName} - 이미 생성 중입니다.`,
          'beforeData', beforeData, 'maxPublicValue', maxPublicValue);
      }
    } else {
      Logger.info({ __filename, reqInfo }, `${apiName} - 프레임 체크 및 업데이트 최대값 보다 작다.`,
        'lastPublicValue', endPublicValue - 1);
      const beforeData = await PInfoPublicIdFrameRepo.findByIdAndUpdate(publicIdFrame._id, {
        lastPublicValue: endPublicValue - 1,
        lastModifiedData: new Date(),
      });

      console.log('beforeData 2', beforeData, 'endPublicValue 2', endPublicValue);
      if (beforeData && beforeData.lastPublicValue + beforeData.createNums !== endPublicValue - 1) {
        throw Logger.error({ __filename, reqInfo }, `${apiName} - 이미 생성 중입니다.`,
          'beforeData', beforeData, 'endPublicValue', endPublicValue);
      }
    }

    Logger.info({ __filename, reqInfo }, `${apiName} - 프레임 체크 및 업데이트 완료`,
      'prefixPublicValue', prefixPublicValue,
      'startPublicValue', startPublicValue,
      'endPublicValue', endPublicValue,
      'maxPublicValueLength', maxPublicValueLength);

    return {
      prefixPublicValue,
      startPublicValue,
      endPublicValue,
      maxPublicValueLength,
    };
  }
  Logger.info({ __filename, reqInfo }, `${apiName} - 프레임 데이터 가져오기`);
  let publicIdFrame : PIntoPublicIdFrame | null = await PInfoPublicIdFrameRepo.findOne({}).lean();
  if (!publicIdFrame) publicIdFrame = await createPublicIdFram();
  const result = await checkAndUpatePublicIdFrame(publicIdFrame);
  return result;
}

// 2. public key 생성
async function createPublicIdList(
  reqInfo: reqInfoInf,
  data: dataInf,
  prefixPublicValue : string,
  startPublicValue : number,
  endPublicValue : number,
  maxPublicValueLength : number,
) : Promise<void> {
  let pInfoPublicIdList: PIntoPublicId[] = [];
  for (let i = startPublicValue; i < endPublicValue; i += 1) {
    let publicId = String(i);
    if (publicId.length < maxPublicValueLength) {
      let zeroNums = '';
      for (let j = 0; j < maxPublicValueLength - publicId.length; j += 1) {
        zeroNums = `0${zeroNums}`;
      }
      publicId = `${zeroNums}${publicId}`;
    }
    publicId = `${prefixPublicValue}_${publicId}`;
    // console.log('publicId', publicId);
    const pInfoPublicId = PInfoPublicIdRepo.init();
    pInfoPublicId.publicId = publicId;
    pInfoPublicIdList.push(pInfoPublicId);
  }

  if (pInfoPublicIdList.length > 0) {
    await PInfoPublicIdRepo.collection_insertMany(pInfoPublicIdList);
    pInfoPublicIdList = [];
  }
}
