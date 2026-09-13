import { Image, StyleSheet, View } from 'react-native';

const logoUcm = require('../../assets/ucm-30-anos-logo.png');

type LogoUcmProps = {
  size?: number;
};

export default function LogoUcm({ size = 48 }: LogoUcmProps) {
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={logoUcm} style={{ width: size * 0.86, height: size * 0.86 }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
