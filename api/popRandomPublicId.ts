/*
  description: pInfo publicId 생성
    정책
      1 ~ 999999999999 난수를 생성
    FLOW :
  @author: jun
  @date: 2021-09-16
*/

// 모듈
import Logger from '../../../core/Logger';

// api
import createPublicId from './createPublicId';

// 모델
import reqInfoInf from '../../../database/Inf/reqInfoInf';
// import PIntoPublicId from '../../../database/mongoose/model/purchasedInfo/PIntoPublicId';
// import PInfoInf from '../../../database/mongoose/model/purchasedInfo/PInfo';

// 모델 repo
import PInfoPublicIdRepo from '../../../database/mongoose/repository/purchasedInfo/publicId/PInfoPublicIdRepo';

export interface dataInf {
}

// interface apiResultInf {
// }

const MUST_REMAIN_NUMS = 100;

const apiName = 'pInfo random publicId pop';
export default async function __popRandomPublicId(reqInfo : reqInfoInf, data : dataInf) {
  Logger.info({ __filename, reqInfo }, `${apiName} - 시작`, 'data', data);

  // const s = Number(new Date());
  // console.log('start', s);

  // 1. 랜덤한 값 pop
  let publicId = await PInfoPublicIdRepo.popRandomId();

  if (!publicId) {
    try {
      await createPublicId(reqInfo, data);
      publicId = await PInfoPublicIdRepo.popRandomId();
    } catch (err) {
      Logger.debug({ __filename, reqInfo }, `${apiName} - public id 발급 중 오류`, 'publicId', publicId, 'err', err);
    }
  }

  const publicIdNums = await PInfoPublicIdRepo.count({});

  if (publicIdNums < MUST_REMAIN_NUMS) {
    try {
      createPublicId(reqInfo, data);
    } catch (err) {
      Logger.debug({ __filename, reqInfo }, `${apiName} - public id 발급 중 오류`, 'publicId', publicId, 'err', err);
    }
  }

  // const e = Number(new Date());

  console.log('publicId', publicId);
  // console.log('end', e);
  // console.log(e - s);
  return publicId;
}
