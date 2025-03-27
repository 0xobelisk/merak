'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Transaction, isValidSuiAddress } from '@0xobelisk/sui-client';
import { initMerakClient } from '@/app/jotai/merak';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { Switch } from '@repo/ui/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/ui/alert';
import { WALLETCHAIN } from '@/app/constants';

interface BlobInfo {
  status: string;
  blobId: string;
  endEpoch: string;
  suiRefType: string;
  suiRef: string;
  suiBaseUrl: string;
  blobUrl: string;
  isImage: boolean;
  media_type: string;
}

export default function Create() {
  const [uploadedBlobs, setUploadedBlobs] = useState<BlobInfo[]>([]);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [decimals, setDecimals] = useState('9');
  const [isFormComplete, setIsFormComplete] = useState(false);
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  const [actualSupply, setActualSupply] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [owner, setOwner] = useState('');
  const [isMintable, setIsMintable] = useState(false);
  const [isBurnable, setIsBurnable] = useState(false);
  const [isFreezable, setIsFreezable] = useState(false);
  const [sendToError, setSendToError] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [useSendToMyAddress, setUseSendToMyAddress] = useState(false);
  const [useOwnerMyAddress, setUseOwnerMyAddress] = useState(false);
  const account = useCurrentAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const basePubslisherUrl = 'https://publisher.walrus-testnet.walrus.space';
  const Aggregator = 'https://aggregator.walrus-testnet.walrus.space';

  useEffect(() => {
    // Update form completion check
    const isComplete =
      tokenName !== '' &&
      tokenSymbol !== '' &&
      description !== '' &&
      decimals !== '' &&
      initialSupply !== '' &&
      sendTo !== '' &&
      owner !== '' &&
      uploadedBlobs.length > 0 &&
      !sendToError &&
      !ownerError;
    setIsFormComplete(isComplete);
  }, [
    tokenName,
    tokenSymbol,
    description,
    decimals,
    initialSupply,
    sendTo,
    owner,
    uploadedBlobs,
    sendToError,
    ownerError
  ]);

  useEffect(() => {
    if (initialSupply && decimals) {
      const supply = parseFloat(initialSupply);
      const dec = parseInt(decimals);
      if (!isNaN(supply) && !isNaN(dec)) {
        setActualSupply((supply * Math.pow(10, dec)).toString());
      } else {
        setActualSupply('');
      }
    } else {
      setActualSupply('');
    }
  }, [initialSupply, decimals]);

  useEffect(() => {
    if (useSendToMyAddress && account?.address) {
      setSendTo(account.address);
      validateAddress(account.address, setSendToError);
    }
  }, [useSendToMyAddress, account?.address]);

  useEffect(() => {
    if (useOwnerMyAddress && account?.address) {
      setOwner(account.address);
      validateAddress(account.address, setOwnerError);
    }
  }, [useOwnerMyAddress, account?.address]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const numEpochs = 1; // Adjust as needed
      setIsUploading(true);
      setUploadError(null);

      try {
        const response = await fetch(`${basePubslisherUrl}/v1/blobs?epochs=${numEpochs}`, {
          method: 'PUT',
          body: file
        });

        if (response.status === 200) {
          const storage_info = await response.json();
          console.log('storage_info', storage_info);
          const blobInfo = processUploadResponse(storage_info, file.type);
          setUploadedBlobs((prevBlobs) => [blobInfo, ...prevBlobs]);
          closeTokenImageArea();
        } else {
          throw new Error('Something went wrong when storing the blob!');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError('An error occurred while uploading. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const closeTokenImageArea = () => {
    const tokenImageArea = document.getElementById('dropzone-file');
    if (tokenImageArea) {
      tokenImageArea.style.display = 'none';
    }

    // Optionally hide the parent element of the upload area
    const uploadArea = tokenImageArea?.closest('label');
    if (uploadArea) {
      uploadArea.style.display = 'none';
    }
  };

  const processUploadResponse = (storage_info: any, media_type: string): BlobInfo => {
    const SUI_NETWORK = 'testnet';
    const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
    const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;

    let info: BlobInfo;
    if ('alreadyCertified' in storage_info) {
      info = {
        status: 'Already certified',
        blobId: storage_info.alreadyCertified.blobId,
        endEpoch: storage_info.alreadyCertified.endEpoch,
        suiRefType: 'Previous Sui Certified Event',
        suiRef: storage_info.alreadyCertified.event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
        blobUrl: `${Aggregator}/v1/blobs/${storage_info.alreadyCertified.blobId}`,
        isImage: media_type.startsWith('image'),
        media_type: media_type
      };
      console.log(media_type.startsWith('image'));
    } else if ('newlyCreated' in storage_info) {
      info = {
        status: 'Newly created',
        blobId: storage_info.newlyCreated.blobObject.blobId,
        endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: 'Associated Sui Object',
        suiRef: storage_info.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
        blobUrl: `${Aggregator}/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`,
        isImage: media_type.startsWith('image'),
        media_type: media_type
      };
      console.log(media_type.startsWith('image'));
    } else {
      throw Error('Unhandled successful response!');
    }

    return info;
  };

  // Add utility function at the component top
  const truncateMiddle = (str: string, startLength = 6, endLength = 4) => {
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
  };

  const validateAddress = (address: string, setError: (error: string) => void) => {
    if (!isValidSuiAddress(address)) {
      setError('Invalid Sui address');
    } else {
      setError('');
    }
  };

  const handleSendToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSendTo(value);
    validateAddress(value, setSendToError);
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOwner(value);
    validateAddress(value, setOwnerError);
  };

  const handleUseSendToMyAddress = (checked: boolean) => {
    setUseSendToMyAddress(checked);
    if (!checked) {
      setSendTo('');
      setSendToError('');
    } else if (account?.address) {
      setSendTo(account.address);
      validateAddress(account.address, setSendToError);
    }
  };

  const handleUseOwnerMyAddress = (checked: boolean) => {
    setUseOwnerMyAddress(checked);
    if (!checked) {
      setOwner('');
      setOwnerError('');
    } else if (account?.address) {
      setOwner(account.address);
      validateAddress(account.address, setOwnerError);
    }
  };

  const handleCreate = async () => {
    try {
      const merak = initMerakClient();
      const mintInfo = {
        tokenName,
        tokenSymbol,
        description,
        decimals: parseInt(decimals, 10),
        blobUrl: uploadedBlobs[0]?.blobUrl,
        initialSupply: BigInt(parseFloat(initialSupply) * Math.pow(10, parseInt(decimals, 10)))
      };
      let tx = new Transaction();

      console.log('tokenSymbol', tokenSymbol);
      console.log('description', description);
      console.log('decimals', mintInfo.decimals);
      console.log('initialSupply', mintInfo.initialSupply);
      console.log('sendTo', sendTo);
      console.log('owner', owner);
      console.log('isMintable', isMintable);
      console.log('isBurnable', isBurnable);
      console.log('isFreezable', isFreezable);

      await merak.create(
        tx,
        tokenName,
        tokenSymbol,
        description,
        mintInfo.decimals,
        mintInfo.blobUrl,
        mintInfo.blobUrl,
        mintInfo.initialSupply, // Use the adjusted initialSupply
        sendTo,
        owner,
        isMintable,
        isBurnable,
        isFreezable,
        true
      );

      await signAndExecuteTransaction(
        {
          transaction: tx.serialize(),
          chain: WALLETCHAIN
        },
        {
          onSuccess: (result) => {
            console.log('executed transaction', result);
            toast('Transaction Successful', {
              description: new Date().toUTCString(),
              action: {
                label: 'Check in Explorer',
                onClick: () =>
                  window.open(`https://testnet.suivision.xyz/txblock/${result.digest}`, '_blank')
              }
            });
            setDigest(result.digest);
          },
          onError: (error) => {
            console.log('executed transaction', error);
          }
        }
      );
      console.log('Already minted');
      // Add success notification
    } catch (error) {
      console.error('Minting failed:', error);
      // Add error notification
    }
  };
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Create a New Merak Token</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="tokenName" className="text-gray-600">
                  Token Name
                </Label>
                <Input
                  id="tokenName"
                  placeholder="Enter token name"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="mt-1 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="tokenSymbol" className="text-gray-600">
                  Token Symbol
                </Label>
                <Input
                  id="tokenSymbol"
                  placeholder="Enter token symbol"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="mt-1 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-600">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter token description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="decimals" className="text-gray-600">
                  Decimals
                </Label>
                <Input
                  id="decimals"
                  type="number"
                  placeholder="Enter decimals"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  className="mt-1 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="initialSupply" className="text-gray-600">
                  Initial Supply
                </Label>
                <Input
                  id="initialSupply"
                  type="number"
                  placeholder="Enter initial supply"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  className="mt-1 border-gray-200 focus:border-blue-500 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Actual initial supply: {actualSupply} (with {decimals} decimals)
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Token Properties</Label>
                <div className="flex space-x-4 mt-2">
                  <div className="flex items-center">
                    <Switch
                      id="mintable"
                      checked={isMintable}
                      onCheckedChange={setIsMintable}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <Label htmlFor="mintable" className="ml-2">
                      Mintable
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id="burnable"
                      checked={isBurnable}
                      onCheckedChange={setIsBurnable}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <Label htmlFor="burnable" className="ml-2">
                      Burnable
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id="freezable"
                      checked={isFreezable}
                      onCheckedChange={setIsFreezable}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <Label htmlFor="freezable" className="ml-2">
                      Freezable
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div>
                <Label htmlFor="sendTo" className="text-gray-600">
                  Send To
                </Label>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    id="useSendToMyAddress"
                    checked={useSendToMyAddress}
                    onCheckedChange={handleUseSendToMyAddress}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="useSendToMyAddress">Use my address</Label>
                </div>
                <Input
                  id="sendTo"
                  placeholder="Enter recipient address"
                  value={sendTo}
                  onChange={handleSendToChange}
                  disabled={useSendToMyAddress}
                  className="border-gray-200 focus:border-blue-500 rounded-lg"
                />
                {sendToError && <p className="text-red-500 text-sm mt-1">{sendToError}</p>}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div>
                <Label htmlFor="owner" className="text-gray-600">
                  Owner
                </Label>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    id="useOwnerMyAddress"
                    checked={useOwnerMyAddress}
                    onCheckedChange={handleUseOwnerMyAddress}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="useOwnerMyAddress">Use my address</Label>
                </div>
                <Input
                  id="owner"
                  placeholder="Enter owner address"
                  value={owner}
                  onChange={handleOwnerChange}
                  disabled={useOwnerMyAddress}
                  className="border-gray-200 focus:border-blue-500 rounded-lg"
                />
                {ownerError && <p className="text-red-500 text-sm mt-1">{ownerError}</p>}
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="mt-8">
            <Label htmlFor="projectImage" className="text-gray-600">
              Token Image
            </Label>
            <div className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C4.157 4.688 3 4.345 3 5.587V14a1 1 0 0 0 1 1h8Z"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SVG, PNG, JPG or GIF (MAX. 10MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Uploaded Files Section */}
          <section id="uploaded-blobs" className="mt-8 space-y-4">
            {uploadedBlobs.map((info, index) => (
              <article key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-6">
                  {info.isImage && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <object
                        type={info.media_type}
                        data={info.blobUrl}
                        className="w-full h-full object-contain rounded-lg"
                      ></object>
                    </div>
                  )}
                  <dl className="blob-info flex-1 space-y-2">
                    <div>
                      <dt className="font-semibold text-gray-700">Status</dt>
                      <dd>{info.status}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-700">Blob ID</dt>
                      <dd>
                        <a
                          href={info.blobUrl}
                          className="text-blue-600 hover:underline"
                          title={info.blobId}
                        >
                          {info.blobId}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-700">{info.suiRefType}</dt>
                      <dd>
                        <a
                          href={`${info.suiBaseUrl}/${info.suiRef}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          title={info.suiRef}
                        >
                          {truncateMiddle(info.suiRef, 18, 16)}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-700">Stored until epoch</dt>
                      <dd>{info.endEpoch}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))}
          </section>

          {/* Create Button */}
          <div className="mt-8">
            {isFormComplete ? (
              <Button
                onClick={handleCreate}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
              >
                Create Token
              </Button>
            ) : (
              <p className="text-center text-gray-500">
                Please complete all fields to enable creation
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
